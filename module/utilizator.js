// Etapa 7 – Cerință: Sistemul de utilizatori.
const AccesBD = require("./acces-bd");
const { RolFactory } = require("./roluri");
const email = require("./email");

/** Reprezinta un utilizator PC Forge si operatiile sale persistente. */
class Utilizator {
  static #transportMail = null;

  constructor(date = {}) {
    this.id = date.id ?? null;
    this.username = date.username ?? "";
    this.nume = date.nume ?? "";
    this.prenume = date.prenume ?? "";
    this.email = date.email ?? "";
    this.parola = date.parola ?? "";
    this.salt = date.salt ?? "";
    this.data_nasterii = date.data_nasterii ?? null;
    this.data_inregistrare = date.data_inregistrare ?? null;
    this.culoare_chat = date.culoare_chat ?? "#000000";
    this.rol = RolFactory.creeazaRol(date.rol);
    this.blocat = Boolean(date.blocat);
    this.imagine = date.imagine ?? "/resurse/imagini/utilizatori/avatar-implicit.svg";
    this.confirmat_mail = Boolean(date.confirmat_mail);
    this.token_confirmare_1 = date.token_confirmare_1 ?? null;
    this.token_confirmare_2 = date.token_confirmare_2 ?? null;
    this.tema = date.tema ?? "light";
    this.ultima_logare = date.ultima_logare ?? null;
    this.ultima_activitate = date.ultima_activitate ?? null;
    this.ip_ultima_accesare = date.ip_ultima_accesare ?? null;
    // Etapa 8 – Bonus 3: Validarea datelor utilizatorului.
    this.notificare_confirmare_trimisa = date.notificare_confirmare_trimisa ?? null;
    this.token_resetare = date.token_resetare ?? null;
    this.expirare_token_resetare = date.expirare_token_resetare ?? null;
    this.incercari_login = Number(date.incercari_login || 0);
    this.prima_incercare_esuat = date.prima_incercare_esuat ?? null;
    this.blocat_login_pana = date.blocat_login_pana ?? null;
    this.ultima_promotie = date.ultima_promotie ?? null;
    // Etapa 8 – Bonus 9: Autentificare persistentă.
    this.ramai_conectat = Boolean(date.ramai_conectat);
  }

  /**
   * Configureaza adaptorul de e-mail.
   * @param {{sendMail: Function}} transport Obiect care expune sendMail().
   * @returns {void}
   */
  static configureazaTransportMail(transport) {
    Utilizator.#transportMail = transport;
  }

  /** @returns {boolean} True daca username-ul respecta formatul acceptat. */
  verificaNume() {
    return /^[A-Za-zĂÂÎȘȚăâîșț][A-Za-z0-9ĂÂÎȘȚăâîșț._-]{2,29}$/.test(this.username);
  }

  /** @returns {boolean} True daca adresa de e-mail este valida sintactic. */
  verificaEmail() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  /** @returns {true} True la succes; arunca Error pentru date invalide. */
  valideaza() {
    if (!this.verificaNume()) throw new Error("Username-ul trebuie sa aiba 3-30 de caractere valide.");
    if (!this.verificaEmail()) throw new Error("Adresa de e-mail nu este valida.");
    if (!this.nume.trim() || !this.prenume.trim()) throw new Error("Numele si prenumele sunt obligatorii.");
    return true;
  }

  /**
   * @param {object} dateNoi Campurile care trebuie actualizate.
   * @returns {Promise<Utilizator>} Instanta actualizata.
   */
  async modifica(dateNoi = {}) {
    if (!this.id) throw new Error("Utilizatorul nu exista in baza de date.");
    const campuriPermise = ["nume", "prenume", "email", "parola", "salt", "data_nasterii", "culoare_chat", "rol", "blocat", "imagine", "confirmat_mail", "token_confirmare_1", "token_confirmare_2", "tema", "ultima_logare", "ultima_activitate", "ip_ultima_accesare", "notificare_confirmare_trimisa", "token_resetare", "expirare_token_resetare", "incercari_login", "prima_incercare_esuat", "blocat_login_pana", "ultima_promotie", "ramai_conectat"];
    const campuri = Object.keys(dateNoi).filter((camp) => campuriPermise.includes(camp));
    if (!campuri.length) throw new Error("Nu exista date permise pentru modificare.");
    const valori = campuri.map((camp) => camp === "rol" ? (dateNoi.rol.cod || dateNoi.rol) : dateNoi[camp]);
    const randuri = await AccesBD.getInstanta().update({ tabel: "utilizatori", campuri, valori, conditiiAnd: { id: this.id } });
    Object.assign(this, randuri[0]);
    this.rol = RolFactory.creeazaRol(randuri[0].rol);
    return this;
  }

  /** @returns {Promise<Utilizator>} Instanta cu id-ul primit din baza. */
  async salveaza() {
    this.valideaza();
    const existent = await Utilizator.cautaDupaUsername(this.username);
    if (existent) throw new Error("Username-ul exista deja.");
    const rand = await AccesBD.getInstanta().insert({
      tabel: "utilizatori",
      campuri: ["username", "nume", "prenume", "email", "parola", "salt", "data_nasterii", "culoare_chat", "rol", "blocat", "imagine", "confirmat_mail", "token_confirmare_1", "token_confirmare_2", "tema"],
      valori: [this.username, this.nume, this.prenume, this.email, this.parola, this.salt, this.data_nasterii, this.culoare_chat, this.rol.cod, this.blocat, this.imagine, this.confirmat_mail, this.token_confirmare_1, this.token_confirmare_2, this.tema],
    });
    this.id = rand.id;
    return this;
  }

  /** Alias cu numele cerut in enunt pentru inregistrarea utilizatorului. */
  async salvareUtilizator() {
    return this.salveaza();
  }

  /** @returns {Promise<object|null>} Randul eliminat sau null. */
  async sterge() {
    if (!this.id) throw new Error("Utilizatorul nu exista in baza de date.");
    const randuri = await AccesBD.getInstanta().delete({ tabel: "utilizatori", conditiiAnd: { id: this.id } });
    return randuri[0] || null;
  }

  /** @param {string} username Numele cautat. @returns {Promise<Utilizator|null>} Utilizatorul sau null. */
  static async cautaDupaUsername(username) {
    const randuri = await AccesBD.getInstanta().select({ tabel: "utilizatori", conditiiAnd: { username } });
    return randuri[0] ? new Utilizator(randuri[0]) : null;
  }

  /**
   * Varianta callback ceruta pentru cautarea dupa username.
   * @param {string} username Numele cautat.
   * @param {object} obDate Date suplimentare transmise callbackului.
   * @param {Function} callback Functia (eroare, utilizator, obDate).
   * @returns {void}
   */
  static getUtilizDupaUsername(username, obDate, callback) {
    Utilizator.cautaDupaUsername(username)
      .then((utilizator) => callback(null, utilizator, obDate))
      .catch((eroare) => callback(eroare, null, obDate));
  }

  /** @param {string} username Numele cautat. @returns {Promise<Utilizator|null>} Utilizatorul sau null. */
  static async getUtilizDupaUsernameAsync(username) {
    return Utilizator.cautaDupaUsername(username);
  }

  /**
   * @param {object} obParam Egalitatile cautate.
   * @param {Function} [callback] Callback optional (eroare, utilizatori).
   * @returns {Promise<Utilizator[]>} Lista obiectelor gasite.
   */
  static async cauta(obParam = {}, callback) {
    const conditii = { ...obParam };
    delete conditii.callback;
    const randuri = await AccesBD.getInstanta().select({ tabel: "utilizatori", conditiiAnd: conditii });
    const utilizatori = randuri.map((rand) => new Utilizator(rand));
    if (typeof callback === "function") callback(null, utilizatori);
    return utilizatori;
  }

  /** @param {object} obParam Egalitatile cautate. @returns {Promise<Utilizator[]>} Lista gasita. */
  static async cautaAsync(obParam = {}) {
    return Utilizator.cauta(obParam);
  }

  /* Etapa 8 – Bonus 11e: Roluri cu perioadă de valabilitate. */
  areDreptul(drept) {
    if (typeof drept === "symbol") return this.rol.areDreptul(drept);
    if (!this.id) return Promise.resolve(false);
    if (this.rol.cod === "admin") return Promise.resolve(true);
    const id = Number(drept);
    const cautaDupaId = Number.isInteger(id) && id > 0;
    return AccesBD.getInstanta().getClient().query(
      `SELECT EXISTS(
        SELECT 1 FROM utilizatori_roluri ur
        JOIN roluri_drepturi rd ON rd.id_rol=ur.id_rol
        JOIN drepturi d ON d.id=rd.id_drept
        WHERE ur.id_utilizator=$1
          AND (ur.data_inceput IS NULL OR ur.data_inceput<=CURRENT_DATE)
          AND (ur.data_expirare IS NULL OR ur.data_expirare>=CURRENT_DATE)
          AND (${cautaDupaId ? "d.id=$2" : "d.nume=$2"})
      ) AS permis`,
      [this.id, cautaDupaId ? id : String(drept)],
    ).then((rezultat) => rezultat.rows[0].permis);
  }

  /**
   * @param {string} subiect Subiectul mesajului.
   * @param {string} mesajText Varianta text simplu.
   * @param {string} mesajHtml Varianta HTML.
   * @param {object[]} [atasamente=[]] Atasamentele adaptorului de e-mail.
   * @returns {Promise<object>} Rezultatul transportului configurat.
   */
  async trimiteMail(subiect, mesajText, mesajHtml, atasamente = []) {
    const transport = Utilizator.#transportMail || { sendMail: email.trimite };
    return transport.sendMail({
      to: this.email,
      subject: subiect,
      text: mesajText,
      html: mesajHtml,
      attachments: atasamente,
    });
  }

  /**
   * Genereaza username-uri libere pornind de la valoarea dorita.
   * @param {string} baza Username-ul ocupat.
   * @param {number} [numar=3] Numarul sugestiilor.
   * @returns {Promise<string[]>} Variante care nu exista in tabela.
   */
  static async sugereazaUsername(baza, numar = 3) {
    const sugestii = [];
    let sufix = 1;
    while (sugestii.length < numar && sufix < 1000) {
      const candidat = `${baza}${sufix}`.slice(0, 30);
      if (!(await Utilizator.cautaDupaUsername(candidat))) sugestii.push(candidat);
      sufix++;
    }
    return sugestii;
  }
}

module.exports = Utilizator;

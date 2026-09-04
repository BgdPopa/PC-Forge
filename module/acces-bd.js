// Etapa 7 – Cerință: Clasa AccesBD.
const { Pool } = require("pg");

/**
 * Gestioneaza o singura instanta a conexiunii la baza de date.
 * Metodele accepta optional un callback Node.js de forma (eroare, rezultat).
 */
class AccesBD {
  static #instanta = null;

  #client;

  constructor() {
    if (AccesBD.#instanta) {
      throw new Error("AccesBD este singleton. Foloseste AccesBD.getInstanta().");
    }
    this.#client = null;
  }

  /**
   * Returneaza unica instanta AccesBD si o initializeaza la primul apel.
   * @param {object} [configuratie] Configuratia acceptata de pg.Pool.
   * @returns {AccesBD}
   */
  static getInstanta(configuratie) {
    if (!AccesBD.#instanta) {
      AccesBD.#instanta = new AccesBD();
      AccesBD.#instanta.initializare(configuratie);
    }
    return AccesBD.#instanta;
  }

  /**
   * Creeaza pool-ul PostgreSQL folosit de toate operatiile ulterioare.
   * @param {object} [configuratie] Datele conexiunii; implicit sunt citite din .env.
   * @returns {AccesBD}
   */
  initializare(configuratie = {}) {
    if (this.#client) return this;
    this.#client = new Pool({
      host: configuratie.host || process.env.DB_HOST,
      port: Number(configuratie.port || process.env.DB_PORT),
      database: configuratie.database || process.env.DB_NAME,
      user: configuratie.user || process.env.DB_USER,
      password: configuratie.password || process.env.DB_PASSWORD,
    });
    return this;
  }

  /** @returns {Pool} Pool-ul pg, util pentru interogari specifice aplicatiei. */
  getClient() {
    if (!this.#client) throw new Error("AccesBD nu a fost initializat.");
    return this.#client;
  }

  /** @param {string} nume Numele unui tabel sau camp. @returns {string} Identificator SQL citat. */
  #identificator(nume) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(nume)) {
      throw new Error(`Identificator SQL nepermis: ${nume}`);
    }
    return `"${nume}"`;
  }

  /**
   * @param {Promise<any>} promisiune Operatia asincrona.
   * @param {Function} [callback] Callback optional (eroare, rezultat).
   * @returns {Promise<any>} Aceeasi promisiune, pentru folosire cu await.
   */
  #finalizeaza(promisiune, callback) {
    if (typeof callback === "function") {
      promisiune.then((rezultat) => callback(null, rezultat)).catch(callback);
    }
    return promisiune;
  }

  /* Etapa 7 – Bonus 1: Condiții SQL cu operatorul OR. */
  #construiesteConditii(conditiiAnd = {}, conditiiOr = {}, offset = 0) {
    const valori = [];
    const grup = (conditii, operatorLogic) => {
      const intrari = Object.entries(conditii || {});
      if (!intrari.length) return "";
      return `(${intrari.map(([camp, valoare]) => {
        valori.push(valoare);
        return `${this.#identificator(camp)} = $${offset + valori.length}`;
      }).join(` ${operatorLogic} `)})`;
    };
    const andSql = grup(conditiiAnd, "AND");
    const orSql = grup(conditiiOr, "OR");
    return {
      sql: [andSql, orSql].filter(Boolean).join(" AND "),
      valori,
    };
  }

  /**
   * Selecteaza randuri dintr-un tabel folosind conditii parametrizate.
   * @param {{tabel:string, campuri?:string[], conditiiAnd?:object, conditiiOr?:object}} optiuni
   * @param {Function} [callback]
   * @returns {Promise<object[]>}
   */
  select(optiuni, callback) {
    const campuri = (optiuni.campuri || ["*"]).map((camp) => camp === "*" ? "*" : this.#identificator(camp)).join(", ");
    const conditii = this.#construiesteConditii(optiuni.conditiiAnd, optiuni.conditiiOr);
    const sql = `SELECT ${campuri} FROM ${this.#identificator(optiuni.tabel)}${conditii.sql ? ` WHERE ${conditii.sql}` : ""}`;
    const promisiune = this.getClient().query(sql, conditii.valori).then((rezultat) => rezultat.rows);
    return this.#finalizeaza(promisiune, callback);
  }

  /**
   * Actualizeaza randurile selectate prin conditii AND/OR.
   * @param {{tabel:string, campuri:string[], valori:any[], conditiiAnd?:object, conditiiOr?:object}} optiuni
   * @param {Function} [callback]
   * @returns {Promise<object[]>}
   */
  update(optiuni, callback) {
    if (optiuni.campuri.length !== optiuni.valori.length) throw new Error("Numarul campurilor trebuie sa fie egal cu numarul valorilor.");
    const setari = optiuni.campuri.map((camp, index) => `${this.#identificator(camp)} = $${index + 1}`).join(", ");
    const conditii = this.#construiesteConditii(optiuni.conditiiAnd, optiuni.conditiiOr, optiuni.valori.length);
    const sql = `UPDATE ${this.#identificator(optiuni.tabel)} SET ${setari}${conditii.sql ? ` WHERE ${conditii.sql}` : ""} RETURNING *`;
    const promisiune = this.getClient().query(sql, [...optiuni.valori, ...conditii.valori]).then((rezultat) => rezultat.rows);
    return this.#finalizeaza(promisiune, callback);
  }

  /**
   * Insereaza un rand si returneaza randul creat.
   * @param {{tabel:string, campuri:string[], valori:any[]}} optiuni
   * @param {Function} [callback]
   * @returns {Promise<object>}
   */
  insert(optiuni, callback) {
    if (optiuni.campuri.length !== optiuni.valori.length) throw new Error("Numarul campurilor trebuie sa fie egal cu numarul valorilor.");
    const campuri = optiuni.campuri.map((camp) => this.#identificator(camp)).join(", ");
    const parametri = optiuni.valori.map((_, index) => `$${index + 1}`).join(", ");
    const sql = `INSERT INTO ${this.#identificator(optiuni.tabel)} (${campuri}) VALUES (${parametri}) RETURNING *`;
    const promisiune = this.getClient().query(sql, optiuni.valori).then((rezultat) => rezultat.rows[0]);
    return this.#finalizeaza(promisiune, callback);
  }

  /**
   * Sterge randuri pe baza conditiilor si le returneaza pentru confirmare.
   * @param {{tabel:string, conditiiAnd?:object, conditiiOr?:object}} optiuni
   * @param {Function} [callback]
   * @returns {Promise<object[]>}
   */
  delete(optiuni, callback) {
    const conditii = this.#construiesteConditii(optiuni.conditiiAnd, optiuni.conditiiOr);
    if (!conditii.sql) throw new Error("Stergerea necesita cel putin o conditie.");
    const sql = `DELETE FROM ${this.#identificator(optiuni.tabel)} WHERE ${conditii.sql} RETURNING *`;
    const promisiune = this.getClient().query(sql, conditii.valori).then((rezultat) => rezultat.rows);
    return this.#finalizeaza(promisiune, callback);
  }
}

module.exports = AccesBD;

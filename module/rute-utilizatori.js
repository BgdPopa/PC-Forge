// Etapa 8 – Cerință: Sistemul de utilizatori.
const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Utilizator = require("./utilizator");
const AccesBD = require("./acces-bd");
const email = require("./email");
const { genereazaSalt, cripteazaParola, verificaParola, genereazaToken } = require("./securitate");
const caleOptiuni = path.join(__dirname, "..", "resurse", "json", "optiuni-server.json");

const folderAvataruri = path.join(__dirname, "..", "resurse", "imagini", "utilizatori");
fs.mkdirSync(folderAvataruri, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: folderAvataruri,
    filename(req, fisier, callback) {
      const extensie = path.extname(fisier.originalname).toLowerCase();
      // Etapa 8 – Cerința 8: Sistemul de utilizatori.
      const username = req.session?.utilizator?.username;
      const nume = username
        ? `poza2-${username.replace(/[^A-Za-z0-9_-]/g, "")}${extensie}`
        : `avatar-${Date.now()}-${genereazaToken().slice(0, 10)}${extensie}`;
      callback(null, nume);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(req, fisier, callback) {
    callback(null, ["image/jpeg", "image/png", "image/webp"].includes(fisier.mimetype));
  },
});

/** @param {string} text Text nevalidat. @returns {string} Varianta fara marcaje HTML. */
function textSigur(text) {
  return String(text || "").replace(/[<>]/g, "").trim();
}

/** @param {object} date Datele formularului. @returns {string[]} Lista erorilor de validare. */
function valideazaInregistrare(date) {
  const erori = [];
  const obligatorii = ["nume", "prenume", "username", "parola", "confirmare_parola", "email", "data_nasterii"];
  obligatorii.forEach((camp) => { if (!String(date[camp] || "").trim()) erori.push(`Campul ${camp.replace("_", " ")} este obligatoriu.`); });
  if (date.parola !== date.confirmare_parola) erori.push("Parola si confirmarea parolei nu coincid.");
  if (!/^[A-Za-z0-9_-]+@[A-Za-z0-9]+\.[A-Za-z]{2,3}$/.test(date.email || "")) erori.push("Adresa de e-mail nu respecta formatul cerut.");
  if (!/^[A-Za-zĂÂÎȘȚăâîșț][A-Za-z0-9ĂÂÎȘȚăâîșț._-]{2,29}$/.test(date.username || "")) erori.push("Username-ul trebuie sa aiba 3-30 de caractere si sa inceapa cu o litera.");
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(date.parola || "")) erori.push("Parola trebuie sa aiba minimum 8 caractere, litera mare, litera mica si cifra.");
  return erori;
}

/** @param {object} req Cererea Express. @returns {boolean} True pentru un administrator autentificat. */
function esteAdmin(req) {
  return req.session.utilizator?.rol === "admin";
}

/** Middleware care permite accesul numai utilizatorilor autentificati. */
function necesitaAutentificare(req, res, next) {
  if (!req.session.utilizator) return res.redirect("/?mesaj=Trebuie+să+te+autentifici.");
  next();
}

/** Middleware care permite accesul numai administratorilor. */
function necesitaAdmin(req, res, next) {
  if (!esteAdmin(req)) return res.status(403).render("pagini/eroare", { titlu: "Acces interzis", text: "Această pagină este rezervată administratorilor.", imagine: "/resurse/imagini/erori/eroare-403.svg", ip: req.ip });
  next();
}

/** @param {object} rand Rand PostgreSQL. @returns {object} Datele minime pastrate in sesiune. */
function dateSesiune(rand) {
  return { id: rand.id, username: rand.username, nume: rand.nume, prenume: rand.prenume, email: rand.email, rol: rand.rol?.cod || rand.rol, imagine: rand.imagine, tema: rand.tema, ultimaLogareAnterioara: rand.ultima_logare || null };
}

/* Etapa 8 – Cerință: Sistemul de utilizatori. */
function creeazaRouterUtilizatori() {
  const router = express.Router();
  const pool = AccesBD.getInstanta().getClient();

  router.get("/inregistrare", (req, res) => res.render("pagini/inregistrare", { erori: [], date: {}, sugestii: [], linkConfirmare: null }));

  // Etapa 8 – Bonus 3: Gestionarea conturilor neconfirmate.
  async function verificaConturiNeconfirmate() {
    const optiuni = JSON.parse(fs.readFileSync(caleOptiuni, "utf8"));
    const t1 = Number(optiuni.minutePanaNotificareConfirmare || 60);
    const t2 = Number(optiuni.minuteGratieConfirmare || 1440);
    const deNotificat = await pool.query(`SELECT id,username,prenume,email FROM utilizatori WHERE confirmat_mail=FALSE AND notificare_confirmare_trimisa IS NULL AND data_inregistrare < NOW()-($1||' minutes')::interval`, [t1]);
    for (const utilizator of deNotificat.rows) {
      await email.trimite({ to: utilizator.email, subject: "Confirmă contul PC Forge", text: `Salut, ${utilizator.prenume}! Confirmă adresa; contul neconfirmat va expira peste ${t2} minute.` });
      await pool.query("UPDATE utilizatori SET notificare_confirmare_trimisa=NOW() WHERE id=$1", [utilizator.id]);
    }
    if (optiuni.activeazaStergereConturiNeconfirmate === true) {
      await pool.query(`DELETE FROM utilizatori WHERE confirmat_mail=FALSE AND data_inregistrare < NOW()-(($1+$2)||' minutes')::interval`, [t1, t2]);
    }
  }
  verificaConturiNeconfirmate().catch((eroare) => console.error("Verificare conturi neconfirmate: " + eroare.message));
  setInterval(() => verificaConturiNeconfirmate().catch((eroare) => console.error("Verificare conturi neconfirmate: " + eroare.message)), 10 * 60 * 1000).unref();

  // Etapa 8 – Bonus 10: Promoții pentru utilizatorii inactivi.
  async function trimitePromotiiInactivitate() {
    const rezultat = await pool.query(`SELECT id,prenume,email FROM utilizatori WHERE confirmat_mail=TRUE AND COALESCE(ultima_logare,data_inregistrare)<NOW()-INTERVAL '90 days' AND (ultima_promotie IS NULL OR ultima_promotie<NOW()-INTERVAL '30 days') LIMIT 20`);
    const imagine = path.join(__dirname, "..", "resurse", "imagini", "galerie", "originale", "placa-baza-desktop.jpg");
    for (const utilizator of rezultat.rows) {
      await email.trimite({ to: utilizator.email, subject: "Atelierul PC Forge te așteaptă", text: `Salut, ${utilizator.prenume}! Descoperă cele mai noi componente PC Forge.`, html: `<h1>Revino în atelierul PC Forge</h1><p>Am adăugat componente și seturi noi.</p><img src="cid:forge-promo" width="480">`, attachments: fs.existsSync(imagine) ? [{ filename: "pc-forge.jpg", path: imagine, cid: "forge-promo" }] : [] });
      await pool.query("UPDATE utilizatori SET ultima_promotie=NOW() WHERE id=$1", [utilizator.id]);
    }
  }
  trimitePromotiiInactivitate().catch((eroare) => console.error("Promotii inactive: " + eroare.message));
  setInterval(() => trimitePromotiiInactivitate().catch((eroare) => console.error("Promotii inactive: " + eroare.message)), 24 * 60 * 60 * 1000).unref();

  router.post("/inregistrare", upload.single("imagine"), async function (req, res) {
    const date = Object.fromEntries(Object.entries(req.body).map(([cheie, valoare]) => [cheie, textSigur(valoare)]));
    const erori = valideazaInregistrare(date);
    const existent = date.username ? await Utilizator.cautaDupaUsername(date.username) : null;
    const emailExistent = date.email ? (await Utilizator.cauta({ email: date.email }))[0] : null;
    let sugestii = [];
    if (existent) {
      erori.push("Username-ul este deja folosit.");
      sugestii = await Utilizator.sugereazaUsername(date.username);
    }
    if (emailExistent) erori.push("Adresa de e-mail este deja înregistrată.");
    if (erori.length) return res.status(400).render("pagini/inregistrare", { erori, date, sugestii, linkConfirmare: null });

    const salt = genereazaSalt();
    const token1 = genereazaToken();
    const token2 = genereazaToken();
    const utilizator = new Utilizator({
      ...date,
      parola: cripteazaParola(date.parola, salt),
      salt,
      culoare_chat: date.culoare_chat || "#000000",
      imagine: req.file ? `/resurse/imagini/utilizatori/${req.file.filename}` : undefined,
      rol: "comun",
      token_confirmare_1: token1,
      token_confirmare_2: token2,
    });
    await utilizator.salvareUtilizator();
    // Etapa 8 – Bonus 11d: Roluri cu perioadă de valabilitate.
    await pool.query(
      `INSERT INTO utilizatori_roluri(id_utilizator,id_rol,data_inceput,data_expirare)
       SELECT $1,id,NULL,NULL FROM roluri WHERE nume='comun'`,
      [utilizator.id],
    );
    const linkConfirmare = `${req.protocol}://${req.get("host")}/confirmare_inreg/${token1}/${encodeURIComponent(utilizator.username)}/${token2}`;
    await utilizator.trimiteMail(
      `Bună, ${utilizator.username}!`,
      `Bine ai venit în comunitatea PC Forge, ${utilizator.prenume}! Confirmă adresa: ${linkConfirmare}`,
      `<div style="background:lightblue;padding:24px"><h1>Bine ai venit în comunitatea PC Forge, ${utilizator.prenume}!</h1><p><a href="${linkConfirmare}">Confirmă adresa de e-mail</a></p></div>`,
    );
    res.status(201).render("pagini/inregistrare", { erori: [], date: {}, sugestii: [], linkConfirmare: email.modDemonstrativ ? linkConfirmare : null });
  });

  router.get("/confirmare_inreg/:token1/:username/:token2", async function (req, res) {
    const utilizator = await Utilizator.cautaDupaUsername(req.params.username);
    const valid = utilizator && utilizator.token_confirmare_1 === req.params.token1 && utilizator.token_confirmare_2 === req.params.token2;
    if (valid) await utilizator.modifica({ confirmat_mail: true, token_confirmare_1: null, token_confirmare_2: null });
    res.status(valid ? 200 : 400).render("pagini/confirmare-inregistrare", { valid, email: utilizator?.email || "" });
  });

  router.post("/login", async function (req, res) {
    const username = textSigur(req.body.username);
    const utilizator = await Utilizator.cautaDupaUsername(username);
    let eroare = "Username sau parolă incorectă.";
    // Etapa 8 – Bonus 6: Blocarea temporară a autentificării.
    if (utilizator?.blocat_login_pana && new Date(utilizator.blocat_login_pana) > new Date()) {
      req.session.eroareLogin = `Autentificarea este blocată temporar până la ${new Date(utilizator.blocat_login_pana).toLocaleTimeString("ro-RO")}.`;
      return res.redirect("/");
    }
    if (utilizator && verificaParola(req.body.parola, utilizator.salt, utilizator.parola)) {
      if (!utilizator.confirmat_mail) eroare = "Confirmă mai întâi adresa de e-mail.";
      else if (utilizator.blocat) eroare = "Contul este blocat. Contactează administratorul.";
      else {
        const ultimaLogare = utilizator.ultima_logare;
        await utilizator.modifica({ ultima_logare: new Date(), ultima_activitate: new Date(), ip_ultima_accesare: req.ip, incercari_login: 0, prima_incercare_esuat: null, blocat_login_pana: null });
        utilizator.ultima_logare = ultimaLogare;
        req.session.utilizator = dateSesiune(utilizator);
        // Etapa 8 – Bonus 9: Autentificare persistentă.
        if (utilizator.ramai_conectat || req.body.ramai_conectat === "da") {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        }
        return res.redirect("/");
      }
    }
    if (utilizator && !verificaParola(req.body.parola, utilizator.salt, utilizator.parola)) {
      const inFereastra = utilizator.prima_incercare_esuat && Date.now() - new Date(utilizator.prima_incercare_esuat).getTime() <= 10 * 60 * 1000;
      const incercari = inFereastra ? Number(utilizator.incercari_login || 0) + 1 : 1;
      const date = { incercari_login: incercari, prima_incercare_esuat: inFereastra ? utilizator.prima_incercare_esuat : new Date() };
      if (incercari >= 5) {
        date.blocat_login_pana = new Date(Date.now() + 60 * 60 * 1000);
        date.incercari_login = 0;
        await email.trimite({ to: utilizator.email, subject: "Avertizare securitate PC Forge", text: "Autentificarea contului a fost blocată timp de o oră după cinci parole greșite." });
        eroare = "Prea multe încercări. Autentificarea a fost blocată temporar.";
      }
      await utilizator.modifica(date);
    }
    req.session.eroareLogin = eroare;
    res.redirect("/");
  });

  // Etapa 8 – Bonus 4: Recuperarea parolei.
  router.get("/recuperare-parola", (req, res) => res.render("pagini/recuperare-parola", { mesaj: null, linkResetare: null }));
  router.post("/recuperare-parola", async function (req, res) {
    const emailCerut = textSigur(req.body.email);
    const rezultat = await pool.query("SELECT id,username,email FROM utilizatori WHERE email=$1", [emailCerut]);
    let linkResetare = null;
    if (rezultat.rows[0]) {
      const token = genereazaToken();
      await pool.query("UPDATE utilizatori SET token_resetare=$1,expirare_token_resetare=NOW()+INTERVAL '30 minutes' WHERE id=$2", [token, rezultat.rows[0].id]);
      linkResetare = `${req.protocol}://${req.get("host")}/resetare-parola/${encodeURIComponent(rezultat.rows[0].username)}/${token}`;
      await email.trimite({ to: emailCerut, subject: "Resetare parolă PC Forge", text: `Link valabil 30 de minute: ${linkResetare}`, html: `<p><a href="${linkResetare}">Resetează parola PC Forge</a></p>` });
    }
    res.render("pagini/recuperare-parola", { mesaj: "Dacă adresa există, am trimis instrucțiunile de resetare.", linkResetare: email.modDemonstrativ ? linkResetare : null });
  });
  router.get("/resetare-parola/:username/:token", async function (req, res) {
    const rezultat = await pool.query("SELECT username FROM utilizatori WHERE username=$1 AND token_resetare=$2 AND expirare_token_resetare>NOW()", [req.params.username, req.params.token]);
    res.status(rezultat.rows[0] ? 200 : 400).render("pagini/resetare-parola", { valid: Boolean(rezultat.rows[0]), username: req.params.username, token: req.params.token, eroare: null });
  });
  router.post("/resetare-parola/:username/:token", async function (req, res) {
    const valida = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(req.body.parola || "") && req.body.parola === req.body.confirmare_parola;
    if (!valida) return res.status(400).render("pagini/resetare-parola", { valid: true, username: req.params.username, token: req.params.token, eroare: "Parolele trebuie să coincidă și să respecte formatul." });
    const salt = genereazaSalt();
    const rezultat = await pool.query("UPDATE utilizatori SET parola=$1,salt=$2,token_resetare=NULL,expirare_token_resetare=NULL,incercari_login=0,blocat_login_pana=NULL WHERE username=$3 AND token_resetare=$4 AND expirare_token_resetare>NOW() RETURNING email", [cripteazaParola(req.body.parola, salt), salt, req.params.username, req.params.token]);
    if (!rezultat.rows[0]) return res.status(400).render("pagini/resetare-parola", { valid: false, username: req.params.username, token: req.params.token, eroare: "Link invalid sau expirat." });
    await email.trimite({ to: rezultat.rows[0].email, subject: "Parolă PC Forge schimbată", text: "Parola contului a fost resetată." });
    res.redirect("/?mesaj=Parola+a+fost+resetată");
  });

  router.get("/logout", function (req, res) {
    req.session.destroy(() => res.redirect("/"));
  });

  router.get("/profil", necesitaAutentificare, async function (req, res) {
    const utilizator = await Utilizator.cautaDupaUsername(req.session.utilizator.username);
    res.render("pagini/profil", { utilizator, erori: [], mesaj: null });
  });

  router.post("/profil", necesitaAutentificare, upload.single("imagine"), async function (req, res) {
    const utilizator = await Utilizator.cautaDupaUsername(req.session.utilizator.username);
    const erori = [];
    if (!verificaParola(req.body.parola, utilizator.salt, utilizator.parola)) erori.push("Parola curentă nu este corectă.");
    if (!/^[A-Za-z0-9_-]+@[A-Za-z0-9]+\.[A-Za-z]{2,3}$/.test(req.body.email || "")) erori.push("Adresa de e-mail nu este validă.");
    if (req.body.parola_noua || req.body.confirmare_parola_noua) {
      if (req.body.parola_noua !== req.body.confirmare_parola_noua) erori.push("Parola nouă și confirmarea ei nu coincid.");
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(req.body.parola_noua || "")) erori.push("Parola nouă trebuie să aibă minimum 8 caractere, literă mare, literă mică și cifră.");
    }
    if (erori.length) return res.status(400).render("pagini/profil", { utilizator, erori, mesaj: null });
    const dateNoi = {
      nume: textSigur(req.body.nume), prenume: textSigur(req.body.prenume), email: textSigur(req.body.email),
      data_nasterii: req.body.data_nasterii || null, culoare_chat: req.body.culoare_chat || "#000000",
      // Etapa 8 – Bonus 9: Autentificare persistentă.
      ramai_conectat: req.body.ramai_conectat === "da",
    };
    if (req.file) dateNoi.imagine = `/resurse/imagini/utilizatori/${req.file.filename}`;
    if (req.body.parola_noua) {
      dateNoi.salt = genereazaSalt();
      dateNoi.parola = cripteazaParola(req.body.parola_noua, dateNoi.salt);
    }
    await utilizator.modifica(dateNoi);
    req.session.utilizator = dateSesiune(utilizator);
    await utilizator.trimiteMail("Date PC Forge actualizate", "Datele contului tău au fost actualizate.", "<p>Datele contului tău PC Forge au fost actualizate.</p>");
    res.render("pagini/profil", { utilizator, erori: [], mesaj: "Datele au fost actualizate." });
  });

  router.post("/stergere-cont", necesitaAutentificare, async function (req, res) {
    const utilizator = await Utilizator.cautaDupaUsername(req.session.utilizator.username);
    if (!verificaParola(req.body.parola_stergere, utilizator.salt, utilizator.parola)) return res.status(400).render("pagini/profil", { utilizator, erori: ["Parola pentru ștergere este incorectă."], mesaj: null });
    await utilizator.trimiteMail("La revedere de la PC Forge", `La revedere, ${utilizator.prenume}!`, `<p>La revedere, ${utilizator.prenume}! Contul tău PC Forge a fost șters.</p>`);
    await utilizator.sterge();
    req.session.destroy(() => res.redirect("/?mesaj=Contul+a+fost+șters."));
  });

  // Etapa 8 – Bonus 13f: Favorite și notificări de stoc.
  router.get("/cos/adauga/:id", necesitaAutentificare, async function (req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).send("Produs invalid.");
    const exista = await pool.query("SELECT id FROM produse WHERE id=$1", [id]);
    if (!exista.rows[0]) return res.status(404).send("Produs inexistent.");
    req.session.cos = Array.isArray(req.session.cos) ? req.session.cos : [];
    if (!req.session.cos.includes(id)) req.session.cos.push(id);
    res.redirect("/cos");
  });

  router.get("/cos", necesitaAutentificare, async function (req, res) {
    const ids = Array.isArray(req.session.cos) ? req.session.cos : [];
    const produse = ids.length
      ? (await pool.query("SELECT id,nume,imagine,pret::float8 AS pret FROM produse WHERE id=ANY($1::int[]) ORDER BY array_position($1::int[],id)", [ids])).rows
      : [];
    res.render("pagini/cos", { produse });
  });

  router.post("/api/tema", necesitaAutentificare, async function (req, res) {
    // Etapele 6 și 8 – Bonus 2: Trei teme persistente.
    const tema = ["light", "dark", "contrast"].includes(req.body.tema) ? req.body.tema : "light";
    await pool.query("UPDATE utilizatori SET tema=$1 WHERE id=$2", [tema, req.session.utilizator.id]);
    req.session.utilizator.tema = tema;
    res.json({ succes: true, tema });
  });

  router.get("/api/admini-online", async function (req, res) {
    const rezultat = await pool.query("SELECT username, email FROM utilizatori WHERE rol='admin' AND ultima_activitate >= NOW() - INTERVAL '10 minutes' ORDER BY data_inregistrare");
    res.json(rezultat.rows);
  });

  router.get("/administrare-utilizatori", necesitaAdmin, async function (req, res) {
    const rezultat = await pool.query("SELECT id, username, nume, prenume, email, blocat, rol::text, imagine FROM utilizatori WHERE id<>$1 ORDER BY id", [req.session.utilizator.id]);
    res.render("pagini/administrare-utilizatori", { utilizatori: rezultat.rows });
  });

  // Etapa 8 – Bonus 11h: Roluri cu perioadă de valabilitate.
  router.get("/administrare-roluri", necesitaAdmin, async function (req, res) {
    const [utilizatori, roluri, alocari] = await Promise.all([
      pool.query("SELECT id,username,nume,prenume FROM utilizatori ORDER BY username"),
      pool.query("SELECT id,nume,descriere FROM roluri ORDER BY id"),
      pool.query(`SELECT ur.id,u.username,r.nume AS rol,ur.data_inceput,ur.data_expirare FROM utilizatori_roluri ur JOIN utilizatori u ON u.id=ur.id_utilizator JOIN roluri r ON r.id=ur.id_rol ORDER BY u.username,r.nume`),
    ]);
    res.render("pagini/administrare-roluri", { utilizatori: utilizatori.rows, roluri: roluri.rows, alocari: alocari.rows, mesaj: req.query.mesaj || null });
  });
  router.post("/administrare-roluri", necesitaAdmin, async function (req, res) {
    const inceput = req.body.nedeterminat_inceput ? null : (req.body.data_inceput || null);
    const expirare = req.body.nedeterminat_final ? null : (req.body.data_expirare || null);
    if (inceput && expirare && new Date(inceput) > new Date(expirare)) return res.redirect("/administrare-roluri?mesaj=Data+de+început+trebuie+să+fie+anterioară");
    await pool.query("INSERT INTO utilizatori_roluri(id_utilizator,id_rol,data_inceput,data_expirare) VALUES($1,$2,$3,$4) ON CONFLICT(id_utilizator,id_rol,data_inceput) DO UPDATE SET data_expirare=EXCLUDED.data_expirare", [Number(req.body.id_utilizator), Number(req.body.id_rol), inceput, expirare]);
    const rol = await pool.query("SELECT nume FROM roluri WHERE id=$1", [Number(req.body.id_rol)]);
    if (rol.rows[0]) await pool.query("UPDATE utilizatori SET rol=$1::rol_utilizator WHERE id=$2", [rol.rows[0].nume, Number(req.body.id_utilizator)]);
    res.redirect("/administrare-roluri?mesaj=Rol+alocat");
  });
  // Etapa 8 – Bonus 11h: Roluri cu perioadă de valabilitate.
  router.post("/administrare-roluri/:id/editare", necesitaAdmin, async function (req, res) {
    const inceput = req.body.nedeterminat_inceput ? null : (req.body.data_inceput || null);
    const expirare = req.body.nedeterminat_final ? null : (req.body.data_expirare || null);
    if (inceput && expirare && new Date(inceput) > new Date(expirare)) {
      return res.redirect("/administrare-roluri?mesaj=Data+de+început+trebuie+să+fie+anterioară");
    }
    await pool.query(
      "UPDATE utilizatori_roluri SET data_inceput=$1,data_expirare=$2 WHERE id=$3",
      [inceput, expirare, Number(req.params.id)],
    );
    res.redirect("/administrare-roluri?mesaj=Perioada+a+fost+actualizată");
  });
  router.post("/administrare-roluri/:id/stergere", necesitaAdmin, async function (req, res) {
    await pool.query("DELETE FROM utilizatori_roluri WHERE id=$1", [Number(req.params.id)]);
    res.redirect("/administrare-roluri?mesaj=Alocare+ștearsă");
  });

  router.post("/api/utilizatori/:id/blocare", necesitaAdmin, async function (req, res) {
    const rezultat = await pool.query("UPDATE utilizatori SET blocat=NOT blocat WHERE id=$1 AND id<>$2 RETURNING username, prenume, email, blocat", [Number(req.params.id), req.session.utilizator.id]);
    if (!rezultat.rows[0]) return res.status(404).json({ eroare: "Utilizator inexistent." });
    const utilizator = rezultat.rows[0];
    await email.trimite({ to: utilizator.email, subject: utilizator.blocat ? "Cont PC Forge blocat" : "Cont PC Forge deblocat", text: utilizator.blocat ? `N-ai fost cuminte, ${utilizator.prenume}, așa că te-am blocat!` : `Contul tău PC Forge a fost deblocat.` });
    res.json({ succes: true, blocat: utilizator.blocat });
  });

  router.get("/administrare-produse", necesitaAdmin, async function (req, res) {
    const produse = (await pool.query("SELECT id,nume,categorie::text,pret::float8,in_stoc,stoc FROM produse ORDER BY id")).rows;
    res.render("pagini/administrare-produse", { produse, mesaj: req.query.mesaj || null });
  });

  router.post("/administrare-produse/salvare", necesitaAdmin, async function (req, res) {
    const id = Number(req.body.id || 0);
    const stoc = Math.max(0, Number.parseInt(req.body.stoc, 10) || 0);
    const valori = [textSigur(req.body.nume), textSigur(req.body.descriere), textSigur(req.body.imagine), req.body.categorie, textSigur(req.body.subcategorie), Number(req.body.pret), Number(req.body.scor_performanta), req.body.culoare, String(req.body.conectivitate || "").split(",").map((x) => x.trim()).filter(Boolean), stoc > 0 && req.body.in_stoc === "true", stoc];
    const rezultat = id
      ? await pool.query("UPDATE produse SET nume=$1,descriere=$2,imagine=$3,categorie=$4::categorie_produs,subcategorie=$5,pret=$6,scor_performanta=$7,culoare=$8::culoare_produs,conectivitate=$9,in_stoc=$10,stoc=$11 WHERE id=$12 RETURNING id,nume,descriere,imagine,pret::float8,stoc", [...valori, id])
      : await pool.query("INSERT INTO produse(nume,descriere,imagine,categorie,subcategorie,pret,scor_performanta,culoare,conectivitate,in_stoc,stoc) VALUES($1,$2,$3,$4::categorie_produs,$5,$6,$7,$8::culoare_produs,$9,$10,$11) RETURNING id,nume,descriere,imagine,pret::float8,stoc", valori);
    // Etapa 8 – Bonus 13f: Favorite și notificări de stoc.
    const produs = rezultat.rows[0];
    if (produs && produs.stoc < 5) {
      const utilizatori = await pool.query("SELECT DISTINCT u.email,u.prenume FROM favorite f JOIN utilizatori u ON u.id=f.id_utilizator WHERE f.id_produs=$1", [produs.id]);
      const caleImagine = path.join(__dirname, "..", String(produs.imagine).replace(/^[/\\]+/, ""));
      const linkCos = `${process.env.APP_URL || "http://localhost:8080"}/cos/adauga/${produs.id}`;
      for (const utilizator of utilizatori.rows) await email.trimite({
        to: utilizator.email,
        subject: `Stoc redus: ${produs.nume}`,
        text: `${produs.nume}, unul dintre produsele tale favorite, mai are doar ${produs.stoc} bucăți. Adaugă-l în coș: ${linkCos}`,
        html: `<h1>${produs.nume}</h1><p>${produs.descriere}</p><p>${produs.pret.toFixed(2)} lei</p>${fs.existsSync(caleImagine) ? '<img src="cid:produs-favorit" width="480" alt="Produs favorit">' : ''}<p><a href="${linkCos}">Adaugă produsul în coș</a></p>`,
        attachments: fs.existsSync(caleImagine) ? [{ filename: path.basename(caleImagine), path: caleImagine, cid: "produs-favorit" }] : [],
      });
    }
    res.redirect("/administrare-produse?mesaj=Produs+salvat");
  });

  router.post("/administrare-produse/:id/stergere", necesitaAdmin, async function (req, res) {
    await pool.query("DELETE FROM produse WHERE id=$1", [Number(req.params.id)]);
    res.redirect("/administrare-produse?mesaj=Produs+șters");
  });

  // Etapa 8 – Bonus 13a: Adăugarea produselor la favorite.
  router.post("/api/favorite/:id", necesitaAutentificare, async function (req, res) {
    const idProdus = Number(req.params.id);
    const existent = await pool.query("SELECT id FROM favorite WHERE id_produs=$1 AND id_utilizator=$2", [idProdus, req.session.utilizator.id]);
    let esteFavorit;
    if (existent.rows[0]) { await pool.query("DELETE FROM favorite WHERE id=$1", [existent.rows[0].id]); esteFavorit = false; }
    else { await pool.query("INSERT INTO favorite(id_produs,id_utilizator) VALUES($1,$2)", [idProdus, req.session.utilizator.id]); esteFavorit = true; }
    res.json({ succes: true, esteFavorit });
  });

  router.get("/api/favorite-numere", async function (req, res) {
    const ids = String(req.query.ids || "").split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0).slice(0, 100);
    if (!ids.length) return res.json({});
    const rezultat = await pool.query("SELECT id_produs,COUNT(*)::int AS numar FROM favorite WHERE id_produs=ANY($1::int[]) GROUP BY id_produs", [ids]);
    res.json(Object.fromEntries(rezultat.rows.map((rand) => [rand.id_produs, rand.numar])));
  });

  router.get("/favorite", necesitaAutentificare, async function (req, res) {
    const rezultat = await pool.query(`SELECT p.id,p.nume,p.descriere,p.imagine,p.pret::float8 AS pret FROM favorite f JOIN produse p ON p.id=f.id_produs WHERE f.id_utilizator=$1 ORDER BY f.data_favorit DESC`, [req.session.utilizator.id]);
    res.render("pagini/favorite", { produse: rezultat.rows });
  });

  // Etapa 8 – Bonus 13e/f: Favorite și notificări de stoc.
  router.get("/top-favorite", necesitaAdmin, async function (req, res) {
    const rezultat = await pool.query(`SELECT p.id,p.nume,p.stoc,COUNT(f.id)::int AS numar_favorite FROM produse p LEFT JOIN favorite f ON f.id_produs=p.id GROUP BY p.id ORDER BY numar_favorite DESC,p.nume LIMIT 20`);
    res.render("pagini/top-favorite", { produse: rezultat.rows });
  });
  router.post("/top-favorite/:id/stoc", necesitaAdmin, async function (req, res) {
    const cantitate = Number(req.body.cantitate);
    if (!Number.isInteger(cantitate) || cantitate <= 0) return res.status(400).send("Cantitatea trebuie sa fie un numar natural nenul.");
    await pool.query("UPDATE produse SET stoc=stoc+$1,in_stoc=TRUE WHERE id=$2", [cantitate, Number(req.params.id)]);
    res.redirect("/top-favorite");
  });

  router.get("/politica-confidentialitate", (req, res) => res.render("pagini/politica-confidentialitate"));
  return router;
}

module.exports = { creeazaRouterUtilizatori };

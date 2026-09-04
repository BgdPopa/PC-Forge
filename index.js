// Etapa 4 – Cerința 1: Configurarea express.
const express = require("express");
const path = require("path");
const fs = require("fs");

// Etapa 6 – Cerință: Baza de date a produselor.
require("dotenv").config({ path: path.join(__dirname, ".env") });
const accesProduse = require("./module/acces-produse");
const oferte = require("./module/oferte");
const curatareBackup = require("./module/curatare-backup");
const imaginiProduse = require("./module/imagini-produse");

// Etapa 8 – Cerință: Sistemul de utilizatori.
const session = require("express-session");
const AccesBD = require("./module/acces-bd");
const { creeazaRouterUtilizatori } = require("./module/rute-utilizatori");

// Etapa 5 – Cerință: Compilarea automată SCSS.
const sass = require("sass");
const sharp = require("sharp");

// Etapa 4 – Cerința 2: Configurarea app.
const app = express();
const port = 8080;
const caleOptiuniServer = path.join(__dirname, "resurse", "json", "optiuni-server.json");
const optiuniServerInitiale = JSON.parse(fs.readFileSync(caleOptiuniServer, "utf8"));

// Etapa 4 – Cerința 4: Configurarea serverului Express.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Etapa 8 – Bonus 9: Sesiuni persistente de autentificare.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "pc-forge-etapa-8-secret-local",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: Number(optiuniServerInitiale.minuteSesiune || 30) * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
  },
}));

// Etapa 4 – Cerința 6: Ruta /resurse.
app.use("/resurse", express.static(path.join(__dirname, "resurse")));

// Etapa 6 – Cerință: Ruta /resurse/bootstrap-icons.
app.use(
  "/resurse/bootstrap-icons",
  express.static(path.join(__dirname, "node_modules", "bootstrap-icons", "font")),
);

// Etapa 7 – Cerința bootstrap_js: Carduri Bootstrap animate.
app.use(
  "/resurse/bootstrap/js",
  express.static(path.join(__dirname, "node_modules", "bootstrap", "dist", "js")),
);

// Etapa 4 – Cerința 17: Configurarea serverului Express.
app.get(/^\/resurse(\/.*)?$/, function (req, res) {
  afisareEroare(res, 403);
});

// Etapa 4 – Cerința 3: Configurarea serverului Express.
console.log("__dirname     = " + __dirname);
console.log("__filename    = " + __filename);
console.log("process.cwd() = " + process.cwd());

// Etapa 4 – Cerința 20: Configurarea vect_foldere.
const vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];

vect_foldere.forEach(function (numeFolder) {
  const caleFolder = path.join(__dirname, numeFolder);
  if (!fs.existsSync(caleFolder)) {
    fs.mkdirSync(caleFolder);
    console.log("Folder creat: " + caleFolder);
  }
});

// Etapa 4 – Cerința 13: Configurarea obGlobal.
let obGlobal = {
  obErori: null,

  // Etapa 5 – Cerință: Compilarea automată SCSS.
  folderScss: path.join(__dirname, "resurse", "sass"),

  // Etapa 5 – Cerință: Folderul CSS compilat.
  folderCss: path.join(__dirname, "resurse", "css"),

  // Etapa 5 – Cerință: Compilarea automată SCSS.
  folderBackup: path.join(__dirname, "backup"),

  // Etapa 5 – Cerință: Datele galeriei statice.
  obGalerie: null,

  // Etapa 6 – Cerința 4: Categoriile produselor.
  categoriiProduse: [],

  // Etapa 8 – Bonus 12: Data ultimei actualizări.
  dataUltimaModificare: new Date(0),
};

// Etapa 6 – Cerința meniu: Meniul site-ului.
const eticheteCategorii = {
  componente: "Componente",
  stocare: "Stocare",
  racire: "Răcire",
  periferice: "Periferice",
  monitoare: "Monitoare",
};

/**
 * Testeaza baza si publica in app.locals categoriile produselor.
 * @returns {Promise<void>} Promise rezolvat dupa initializarea meniului.
 */
async function initProduse() {
  const conexiune = await accesProduse.testeazaConexiune();
  const valori = await accesProduse.obtineCategorii();
  obGlobal.categoriiProduse = valori.map(function (valoare) {
    return {
      valoare: valoare,
      eticheta: eticheteCategorii[valoare] || valoare,
    };
  });
  app.locals.categoriiProduse = obGlobal.categoriiProduse;
  const rezultatData = await AccesBD.getInstanta().getClient().query(
    "SELECT MAX(data_adaugare) AS data FROM produse",
  );
  const dataProduse = rezultatData.rows[0].data ? new Date(rezultatData.rows[0].data) : new Date(0);
  const dataEjs = obtineCeaMaiNouaDataFisier(path.join(__dirname, "views"), ".ejs");
  obGlobal.dataUltimaModificare = new Date(Math.max(dataProduse.getTime(), dataEjs.getTime()));
  app.locals.dataUltimaModificare = obGlobal.dataUltimaModificare;
  console.log(
    "PostgreSQL conectat: " + conexiune.baza + " / " + conexiune.utilizator,
  );
}

/* Etapa 8 – Bonus 12: Calcularea ultimei actualizări. */
function obtineCeaMaiNouaDataFisier(folder, extensie) {
  let dataMaxima = new Date(0);
  for (const intrare of fs.readdirSync(folder, { withFileTypes: true })) {
    const cale = path.join(folder, intrare.name);
    if (intrare.isDirectory()) {
      const dataSubfolder = obtineCeaMaiNouaDataFisier(cale, extensie);
      if (dataSubfolder > dataMaxima) dataMaxima = dataSubfolder;
    } else if (intrare.name.endsWith(extensie)) {
      const dataFisier = fs.statSync(cale).mtime;
      if (dataFisier > dataMaxima) dataMaxima = dataFisier;
    }
  }
  return dataMaxima;
}

/* Etapa 8 – Bonus 8: Formatarea activității recente. */
function formateazaTimpTrecut(data) {
  if (!data) return null;
  let minute = Math.max(0, Math.floor((Date.now() - new Date(data).getTime()) / 60000));
  const zile = Math.floor(minute / 1440);
  minute -= zile * 1440;
  const ore = Math.floor(minute / 60);
  minute -= ore * 60;
  return [zile ? `${zile} zile` : "", ore ? `${ore} ore` : "", `${minute} minute`]
    .filter(Boolean)
    .join(", ");
}

/* Etapa 6 – Cerința 5: Formatarea datei produsului. */
function formateazaDataProdus(data) {
  const valoareIso = data instanceof Date
    ? data.toISOString().slice(0, 10)
    : String(data || "").slice(0, 10);
  const componente = valoareIso.split("-").map(Number);
  if (componente.length !== 3 || componente.some((valoare) => !Number.isInteger(valoare))) {
    return valoareIso;
  }

  const [an, luna, zi] = componente;
  const dataLocala = new Date(an, luna - 1, zi);
  const luni = [
    "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
  ];
  const zile = [
    "Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă",
  ];

  return `${zi} ${luni[luna - 1]} ${an} (${zile[dataLocala.getDay()]})`;
}

// Etapa 6 – Cerința 5: Helperul pentru data produsului.
app.locals.formateazaDataProdus = formateazaDataProdus;

// Etapa 5 – Cerință: Funcția creeazaFolderDacaNuExista.
/**
 * Creeaza recursiv un folder numai daca acesta lipseste.
 * @param {string} caleFolder Calea absoluta a folderului.
 * @returns {void}
 */
function creeazaFolderDacaNuExista(caleFolder) {
  if (!fs.existsSync(caleFolder)) {
    fs.mkdirSync(caleFolder, { recursive: true });
    console.log("Folder creat: " + caleFolder);
  }
}

// Etapa 5 – Cerință: Compilarea automată SCSS.
/**
 * Compileaza un fisier SCSS si salveaza mai intai un backup al CSS-ului existent.
 * @param {string} caleScss Cale SCSS absoluta sau relativa la folderul Sass.
 * @param {string} [caleCss] Cale CSS optionala; implicit este dedusa din sursa.
 * @returns {void}
 */
function compileazaScss(caleScss, caleCss) {
  let caleScssAbs;
  let caleCssAbs;

  // Daca fisierul SCSS are cale absoluta, o folosim direct.
  // Daca are cale relativa, o consideram relativa la folderScss.
  if (path.isAbsolute(caleScss)) {
    caleScssAbs = caleScss;
  } else {
    caleScssAbs = path.join(obGlobal.folderScss, caleScss);
  }

  // Daca s-a transmis calea CSS, o folosim.
  // Altfel, generam automat numele CSS pornind de la numele SCSS.
  if (caleCss) {
    if (path.isAbsolute(caleCss)) {
      caleCssAbs = caleCss;
    } else {
      caleCssAbs = path.join(obGlobal.folderCss, caleCss);
    }
  } else {
    const caleRelativaScss = path.relative(obGlobal.folderScss, caleScssAbs);
    const caleRelativaCss = caleRelativaScss.replace(/\.scss$/i, ".css");
    caleCssAbs = path.join(obGlobal.folderCss, caleRelativaCss);
  }

  // Cream folderul destinatie pentru CSS, daca nu exista.
  creeazaFolderDacaNuExista(path.dirname(caleCssAbs));

  // Inainte de suprascriere, salvam CSS-ul vechi in backup.
  if (fs.existsSync(caleCssAbs)) {
    try {
      const caleRelativaCss = path.relative(obGlobal.folderCss, caleCssAbs);
      const infoFisierCss = path.parse(caleRelativaCss);

      const numeBackup =
        infoFisierCss.name + "_" + Date.now() + infoFisierCss.ext;

      const caleBackup = path.join(
        obGlobal.folderBackup,
        "resurse",
        "css",
        infoFisierCss.dir,
        numeBackup,
      );

      creeazaFolderDacaNuExista(path.dirname(caleBackup));
      fs.copyFileSync(caleCssAbs, caleBackup);

      console.log("Backup CSS creat: " + caleBackup);
    } catch (eroareBackup) {
      console.error("Eroare la crearea backupului pentru: " + caleCssAbs);
      console.error(eroareBackup.message);
    }
  }

  // Compilarea efectiva SCSS -> CSS
  try {
    const rezultat = sass.compile(caleScssAbs, {
      style: "expanded",
      quietDeps: true,
      // Bootstrap 5 foloseste inca API-uri Sass marcate pentru o versiune
      // viitoare; avertismentele sunt ascunse, fara a ascunde erorile reale.
      silenceDeprecations: [
        "import",
        "global-builtin",
        "color-functions",
        "if-function",
      ],
    });

    fs.writeFileSync(caleCssAbs, rezultat.css);

    console.log("SCSS compilat: " + caleScssAbs + " -> " + caleCssAbs);
  } catch (eroareCompilare) {
    console.error("Eroare la compilarea fisierului SCSS: " + caleScssAbs);
    console.error(eroareCompilare.message);
  }
}

// Etapa 5 – Cerință: Compilarea automată SCSS.
/**
 * Parcurge recursiv folderul Sass si compileaza toate fisierele principale.
 * @returns {void}
 */
function compileazaToateScss() {
  if (!fs.existsSync(obGlobal.folderScss)) {
    console.warn("Folderul SCSS nu exista: " + obGlobal.folderScss);
    return;
  }

  function parcurgeFolder(caleFolder) {
    const elemente = fs.readdirSync(caleFolder);

    for (let element of elemente) {
      const caleElement = path.join(caleFolder, element);
      const statistici = fs.statSync(caleElement);

      if (statistici.isDirectory()) {
        parcurgeFolder(caleElement);
      } else if (
        statistici.isFile() &&
        path.extname(caleElement).toLowerCase() === ".scss" &&
        !path.basename(caleElement).startsWith("_")
      ) {
        compileazaScss(caleElement);
      }
    }
  }

  parcurgeFolder(obGlobal.folderScss);
}

// Etapa 5 – Cerință: Compilarea automată SCSS.
/**
 * Porneste monitorizarea SCSS si recompilarea cu debounce de 500 ms.
 * @returns {void}
 */
function urmaresteScss() {
  if (!fs.existsSync(obGlobal.folderScss)) {
    console.warn(
      "Nu pot urmari folderul SCSS deoarece nu exista: " + obGlobal.folderScss,
    );
    return;
  }

  let timerCompilare = null;

  fs.watch(
    obGlobal.folderScss,
    { recursive: true },
    function (eveniment, numeFisier) {
      if (!numeFisier) {
        return;
      }

      if (path.extname(numeFisier).toLowerCase() !== ".scss") {
        return;
      }

      if (path.basename(numeFisier).startsWith("_")) {
        return;
      }

      clearTimeout(timerCompilare);

      timerCompilare = setTimeout(function () {
        const caleScssModificat = path.join(obGlobal.folderScss, numeFisier);

        if (fs.existsSync(caleScssModificat)) {
          compileazaScss(caleScssModificat);
        }
      }, 500);
    },
  );

  console.log(
    "Monitorizare SCSS pornita pentru folderul: " + obGlobal.folderScss,
  );
}

// Etapa 5 – Cerință: Galeria animată.
/**
 * Citeste o singura data configuratia galeriei din JSON.
 * @returns {void}
 */
function initGalerie() {
  const caleJson = path.join(__dirname, "resurse", "json", "galerie.json");
  const continut = fs.readFileSync(caleJson, "utf8");
  obGlobal.obGalerie = JSON.parse(continut);
  valideazaGalerie();
}

/* Etapa 5 – Bonus 5: Validarea galeriei. */
function valideazaGalerie() {
  const erori = [];
  const caleGalerie = path.join(__dirname, String(obGlobal.obGalerie.cale_galerie || "").replace(/^\//, ""));
  if (!fs.existsSync(caleGalerie) || !fs.statSync(caleGalerie).isDirectory()) {
    erori.push(`Folderul cale_galerie nu exista: ${caleGalerie}`);
  } else {
    for (const imagine of obGlobal.obGalerie.imagini || []) {
      const caleImagine = path.join(caleGalerie, imagine.cale_imagine || "");
      if (!imagine.cale_imagine || !fs.existsSync(caleImagine)) {
        erori.push(`Imagine declarata in galerie.json, dar absenta de pe disc: ${caleImagine}`);
      }
    }
  }
  if (erori.length) erori.forEach((mesaj) => console.error(`[Etapa 5 - Bonus 5] ${mesaj}`));
  else console.log("[Etapa 5 - Bonus 5] Datele galeriei au fost validate cu succes.");
  return erori.length === 0;
}

// Miniaturile au aceeasi dimensiune si sunt decupate automat cu Sharp. Un fisier
// este refacut numai daca lipseste sau daca imaginea originala este mai noua.
/**
 * Genereaza miniaturile WebP lipsa sau invechite cu Sharp.
 * @returns {Promise<void>} Promise rezolvat dupa procesarea imaginilor.
 */
async function pregatesteMiniaturiGalerie() {
  const folderOriginale = path.join(
    __dirname,
    "resurse",
    "imagini",
    "galerie",
    "originale",
  );
  const folderMiniaturi = path.join(
    __dirname,
    "resurse",
    "imagini",
    "galerie",
    "thumbnails",
  );

  creeazaFolderDacaNuExista(folderMiniaturi);

  for (const imagine of obGlobal.obGalerie.imagini) {
    const caleOriginal = path.join(folderOriginale, imagine.cale_imagine);
    const numeMiniatura = path.parse(imagine.cale_imagine).name + ".webp";
    const caleMiniatura = path.join(folderMiniaturi, numeMiniatura);

    if (!fs.existsSync(caleOriginal)) {
      console.warn("Imagine lipsa din galerie: " + caleOriginal);
      continue;
    }

    const trebuieGenerata =
      !fs.existsSync(caleMiniatura) ||
      fs.statSync(caleOriginal).mtimeMs > fs.statSync(caleMiniatura).mtimeMs;

    if (trebuieGenerata) {
      await sharp(caleOriginal)
        .resize(720, 480, {
          fit: "cover",
          position: "attention",
        })
        .webp({ quality: 84 })
        .toFile(caleMiniatura);
      console.log("Miniatura generata: " + caleMiniatura);
    }

    imagine.cale_original =
      obGlobal.obGalerie.cale_galerie + "/" + imagine.cale_imagine;
    imagine.cale_thumbnail =
      obGlobal.obGalerie.cale_thumbnails + "/" + numeMiniatura;
  }
}

/**
 * Selecteaza imaginile aferente sfertului de ora curent.
 * @returns {object[]} Maximum zece obiecte-imagine pentru EJS.
 */
function obtineImaginiGalerieStatica() {
  const sfertOraCurent = Math.floor(new Date().getMinutes() / 15) + 1;

  return obGlobal.obGalerie.imagini
    .filter(function (imagine) {
      return imagine.sfert_ora === sfertOraCurent && imagine.cale_thumbnail;
    })
    .slice(0, 10);
}

/**
 * Alege aleator un grup consecutiv de imagini pentru galeria animata.
 * @returns {{imagini: object[], numarImagini: number}} Datele galeriei animate.
 */
function obtineGalerieAnimata() {
  const imaginiDisponibile = obGlobal.obGalerie.imagini.filter(function (imagine) {
    return imagine.cale_thumbnail;
  });
  const numerePermise = [3, 6, 9, 12].filter(function (numar) {
    return numar < 16 && numar <= imaginiDisponibile.length;
  });
  const numarImagini =
    numerePermise[Math.floor(Math.random() * numerePermise.length)];
  const offset = Math.floor(Math.random() * imaginiDisponibile.length);
  const imagini = [];

  for (let index = 0; index < numarImagini; index++) {
    imagini.push(imaginiDisponibile[(offset + index) % imaginiDisponibile.length]);
  }

  return { imagini: imagini, numarImagini: numarImagini };
}

// Etapa 4 – Cerința 13: Funcția gasesteCheiDuplicateJson.
/* Etapa 4 – Cerință: Funcția gasesteCheiDuplicateJson. */
function gasesteCheiDuplicateJson(continut) {
  const stiva = [];
  const duplicate = [];

  for (let index = 0; index < continut.length; index++) {
    const caracter = continut[index];
    if (caracter === "{") {
      stiva.push({ tip: "obiect", chei: new Set() });
    } else if (caracter === "[") {
      stiva.push({ tip: "vector" });
    } else if (caracter === "}" || caracter === "]") {
      stiva.pop();
    } else if (caracter === '"') {
      const inceput = index;
      index++;
      let escapare = false;
      while (index < continut.length) {
        if (!escapare && continut[index] === '"') break;
        if (!escapare && continut[index] === "\\") escapare = true;
        else escapare = false;
        index++;
      }
      const literal = continut.slice(inceput, index + 1);
      let urmator = index + 1;
      while (/\s/.test(continut[urmator] || "")) urmator++;
      const context = stiva[stiva.length - 1];
      if (continut[urmator] === ":" && context?.tip === "obiect") {
        const cheie = JSON.parse(literal);
        if (context.chei.has(cheie)) {
          const linie = continut.slice(0, inceput).split(/\r?\n/).length;
          duplicate.push(`proprietatea "${cheie}" repetata in jurul liniei ${linie}`);
        }
        context.chei.add(cheie);
      }
    }
  }
  return duplicate;
}

/* Etapa 4 – Cerință: Funcția valideazaDateErori. */
function valideazaDateErori(caleErori) {
  if (!fs.existsSync(caleErori)) {
    console.error(`[Etapa 4 - Bonus] Lipseste fisierul obligatoriu: ${caleErori}`);
    process.exit(1);
  }

  const continut = fs.readFileSync(caleErori, "utf8");
  const probleme = gasesteCheiDuplicateJson(continut);
  let obErori;
  try {
    obErori = JSON.parse(continut);
  } catch (eroare) {
    console.error(`[Etapa 4 - Bonus] erori.json nu este JSON valid: ${eroare.message}`);
    process.exit(1);
  }

  for (const proprietate of ["info_erori", "cale_baza", "eroare_default"]) {
    if (!(proprietate in obErori)) probleme.push(`lipseste proprietatea principala "${proprietate}"`);
  }
  for (const proprietate of ["titlu", "text", "imagine"]) {
    if (!(proprietate in (obErori.eroare_default || {}))) {
      probleme.push(`eroare_default nu are proprietatea "${proprietate}"`);
    }
  }

  const caleFolderImagini = path.join(
    __dirname,
    String(obErori.cale_baza || "").replace(/^[/\\]+/, ""),
  );
  if (!fs.existsSync(caleFolderImagini) || !fs.statSync(caleFolderImagini).isDirectory()) {
    probleme.push(`folderul cale_baza nu exista: ${caleFolderImagini}`);
  } else {
    const toateErorile = [obErori.eroare_default, ...(obErori.info_erori || [])];
    for (const eroare of toateErorile) {
      if (eroare?.imagine && !fs.existsSync(path.join(caleFolderImagini, eroare.imagine))) {
        probleme.push(`imagine inexistenta pentru eroarea ${eroare.identificator || "default"}: ${eroare.imagine}`);
      }
    }
  }

  const grupuriIdentificatori = new Map();
  for (const eroare of obErori.info_erori || []) {
    const grup = grupuriIdentificatori.get(eroare.identificator) || [];
    grup.push(eroare);
    grupuriIdentificatori.set(eroare.identificator, grup);
  }
  for (const [identificator, erori] of grupuriIdentificatori) {
    if (erori.length > 1) {
      const detalii = erori.map(({ identificator: _, ...rest }) => JSON.stringify(rest)).join(" | ");
      probleme.push(`identificator duplicat ${identificator}: ${detalii}`);
    }
  }

  if (probleme.length) {
    probleme.forEach((problema) => console.error(`[Etapa 4 - Bonus] ${problema}`));
  } else {
    console.log("[Etapa 4 - Bonus] erori.json si toate imaginile sale sunt valide.");
  }
  return obErori;
}

/**
 * Citeste configuratia validata a erorilor si completeaza caile imaginilor.
 * @returns {void}
 */
function initErori() {
  const caleErori = path.join(__dirname, "resurse", "json", "erori.json");
  const obErori = valideazaDateErori(caleErori);

  // setarea caii imaginilor pentru fiecare eroare din vector
  for (let eroare of obErori.info_erori) {
    eroare.imagine = obErori.cale_baza + eroare.imagine;
  }
  // setarea caii imaginii si pentru eroarea default
  obErori.eroare_default.imagine =
    obErori.cale_baza + obErori.eroare_default.imagine;

  obGlobal.obErori = obErori;
}

// Etapa 4 – Cerința 14: Configurarea serverului Express.
/**
 * Randeaza pagina unei erori configurate sau eroarea implicita.
 * @param {import("express").Response} res Raspunsul Express.
 * @param {number|null} identificator Codul erorii cautate.
 * @param {string} [titlu] Titlu care suprascrie configuratia.
 * @param {string} [text] Mesaj care suprascrie configuratia.
 * @param {string} [imagine] Cale imagine care suprascrie configuratia.
 * @returns {void}
 */
function afisareEroare(res, identificator, titlu, text, imagine) {
  let eroareInfo = null;

  if (identificator) {
    eroareInfo = obGlobal.obErori.info_erori.find(function (e) {
      return e.identificator == identificator;
    });
  }

  if (eroareInfo) {
    if (eroareInfo.status) {
      res.status(identificator);
    }
  } else {
    // nu s-a gasit identificatorul (sau nu a fost dat) -> eroarea default
    eroareInfo = obGlobal.obErori.eroare_default;
  }

  res.render("pagini/eroare", {
    titlu: titlu || eroareInfo.titlu,
    text: text || eroareInfo.text,
    imagine: imagine || eroareInfo.imagine,
    ip: res.req.ip,
  });
}

// Etapa 4 – Cerința 13: Funcția verificaMentenanta.
initErori();
initGalerie();
// Etapa 6 – Bonus 12: Oferte periodice.
oferte.porneste();
// Etapa 5 – Cerință: Compilarea automată SCSS.
compileazaToateScss();
urmaresteScss();
// Etapa 6 – Bonus 13: Curățarea backupurilor CSS.
curatareBackup.porneste({
  folderBackup: obGlobal.folderBackup,
  caleOptiuniServer: caleOptiuniServer,
});

// Etapa 8 – Bonus 7: Modul de mentenanță.
app.use(function verificaMentenanta(req, res, next) {
  const optiuni = JSON.parse(fs.readFileSync(caleOptiuniServer, "utf8"));
  if (optiuni.mentenanta && req.path !== "/favicon.ico") {
    return res.status(503).render("pagini/mentenanta", { mesaj: optiuni.mesaj });
  }
  next();
});

// Etapa 8 – Cerință: Sistemul de utilizatori.
app.use(async function pregatesteUtilizatorCurent(req, res, next) {
  res.locals.utilizatorCurent = req.session.utilizator || null;
  res.locals.timpUltimaLogare = formateazaTimpTrecut(
    req.session.utilizator?.ultimaLogareAnterioara,
  );
  res.locals.eroareLogin = req.session.eroareLogin || null;
  res.locals.mesajGlobal = req.query.mesaj || null;
  delete req.session.eroareLogin;
  const ultimaVizita = req.session.ultimaVizita ? new Date(req.session.ultimaVizita) : null;
  res.locals.siteModificat = Boolean(ultimaVizita && ultimaVizita < obGlobal.dataUltimaModificare);
  req.session.ultimaVizita = new Date().toISOString();

  if (req.session.utilizator) {
    const acum = Date.now();
    const ultimaActualizare = req.session.activitateActualizataLa || 0;
    if (acum - ultimaActualizare > 60 * 1000) {
      try {
        await AccesBD.getInstanta().getClient().query(
          "UPDATE utilizatori SET ultima_activitate=NOW(), ip_ultima_accesare=$1 WHERE id=$2",
          [req.ip, req.session.utilizator.id],
        );
        req.session.activitateActualizataLa = acum;
      } catch (eroare) {
        console.error("Activitatea utilizatorului nu a putut fi actualizata: " + eroare.message);
      }
    }
  }
  next();
});

// Etapa 8 – Cerință: Ruta /favicon.ico.
app.use(creeazaRouterUtilizatori());

// Etapa 4 – Cerința 19: Ruta /favicon.ico.
app.get("/favicon.ico", function (req, res) {
  res.sendFile(path.join(__dirname, "resurse", "favicons", "favicon.ico"));
});

// Etapa 4 – Cerința 18: Configurarea serverului Express.
app.get(/\.ejs$/, function (req, res) {
  afisareEroare(res, 400);
});

// Etapa 4 – Cerința 8: Configurarea produseNoi.
app.get(["/", "/index", "/home"], async function (req, res) {
  try {
    // Etapa 6 – Bonus 18: Produse noi.
    const produseNoi = await accesProduse.obtineProduseNoi(4);
    const ofertaCurenta = oferte.obtineOfertaCurenta();
    res.render("pagini/index", {
      ip: req.ip,
      imaginiGalerie: obtineImaginiGalerieStatica(),
      galerieAnimata: obtineGalerieAnimata(),
      produseNoi: produseNoi,
      ofertaCurenta: ofertaCurenta,
    });
  } catch (eroare) {
    console.error("Eroare la incarcarea noutatilor: " + eroare.message);
    afisareEroare(res, null, "Eroare produse", "Noutatile nu au putut fi incarcate.");
  }
});

// Etapa 5 – Cerință: Galeria statică.
app.get("/galerie-componente", function (req, res) {
  res.render("pagini/galerie-componente", {
    ip: req.ip,
    imaginiGalerie: obtineImaginiGalerieStatica(),
  });
});

// Etapa 6 – Cerința 1, 4 și 5: Configurarea categorieCeruta.
app.get("/produse", async function (req, res) {
  try {
    const categorieCeruta =
      typeof req.query.categorie === "string" ? req.query.categorie : "";
    const categorieValida = obGlobal.categoriiProduse.some(function (categorie) {
      return categorie.valoare === categorieCeruta;
    });
    const categorie = categorieValida ? categorieCeruta : "";
    const produse = await accesProduse.obtineProduse(categorie);
    // Etapa 8 – Bonus 13: Favorite și notificări de stoc.
    const dateFavorite = await accesProduse.obtineDateFavorite(produse.map((produs) => produs.id), req.session.utilizator?.id);
    produse.forEach((produs) => Object.assign(produs, dateFavorite.get(produs.id) || { numar_favorite: 0, este_favorit: false }));

    // Etapa 6 – Bonusurile 14 și 18: Marcajele Cel mai ieftin și Nou.
    const pretMinimPeCategorie = new Map();
    produse.forEach(function (produs) {
      const minimCurent = pretMinimPeCategorie.get(produs.categorie);
      if (minimCurent === undefined || produs.pret < minimCurent) {
        pretMinimPeCategorie.set(produs.categorie, produs.pret);
      }
    });
    // Etapa 6 – Bonus 12d: Oferte periodice.
    const ofertaCurenta = oferte.obtineOfertaCurenta();
    produse.forEach((produs) => {
      if (ofertaCurenta && produs.categorie === ofertaCurenta.categorie) {
        produs.oferta = ofertaCurenta;
        produs.pretRedus = produs.pret * (1 - ofertaCurenta.reducere / 100);
      }
    });
    const acum = Date.now();
    const intervalProdusNou = 120 * 24 * 60 * 60 * 1000;
    produse.forEach(function (produs) {
      produs.esteCelMaiIeftin =
        produs.pret === pretMinimPeCategorie.get(produs.categorie);
      produs.esteNou =
        acum - new Date(produs.data_adaugare + "T00:00:00").getTime() <=
        intervalProdusNou;
    });

    // Etapa 6 – Bonus 1: Filtre generate din date.
    const scoruri = produse.map((produs) => produs.scor_performanta);
    const subcategorii = [...new Set(produse.map((produs) => produs.subcategorie))].sort();
    const culori = [...new Set(produse.map((produs) => produs.culoare))].sort();
    const conexiuni = [
      ...new Set(produse.flatMap((produs) => produs.conectivitate)),
    ].sort();
    const lungimeMaximaNume = Math.max(
      1,
      ...produse.map((produs) => produs.nume.length),
    );
    const lungimeMaximaDescriere = Math.max(
      3,
      ...produse.map((produs) => produs.descriere.length),
    );
    const optiuniStoc = [
      { valoare: "toate", eticheta: "Toate" },
      ...[...new Set(produse.map((produs) => Boolean(produs.in_stoc)))]
        .sort((a, b) => Number(b) - Number(a))
        .map((inStoc) => ({
          valoare: inStoc ? "da" : "nu",
          eticheta: inStoc ? "In stoc" : "Indisponibil",
        })),
    ];

    res.render("pagini/produse", {
      ip: req.ip,
      produse: produse,
      categorieCurenta: categorie,
      etichetaCategorie: categorie
        ? eticheteCategorii[categorie]
        : "Toate produsele",
      filtre: {
        scorMinim: scoruri.length ? Math.min(...scoruri) : 1,
        scorMaxim: scoruri.length ? Math.max(...scoruri) : 100,
        subcategorii: subcategorii,
        culori: culori,
        conexiuni: conexiuni,
        lungimeMaximaNume: lungimeMaximaNume,
        lungimeMaximaDescriere: lungimeMaximaDescriere,
        exempluNume: produse[0]?.nume || "Produs PC Forge",
        optiuniStoc: optiuniStoc,
        categorii: [
          ...new Set(produse.map((produs) => produs.categorie)),
        ].sort(),
      },
    });
  } catch (eroare) {
    console.error("Eroare la afisarea produselor: " + eroare.message);
    afisareEroare(res, null, "Eroare produse", "Produsele nu au putut fi încărcate.");
  }
});

// Etapa 6 – Cerința 2: Pagina individuală a produsului.
app.get("/produs/:id", async function (req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    afisareEroare(res, 404);
    return;
  }

  try {
    const produs = await accesProduse.obtineProdusDupaId(id);
    if (!produs) {
      afisareEroare(res, 404);
      return;
    }
    // Etapa 6 – Bonus 9: Imagini multiple pentru produs.
    const produseSimilare = await accesProduse.obtineProduseSimilare(produs, 4);
    const dateFavorite = await accesProduse.obtineDateFavorite([produs.id], req.session.utilizator?.id);
    Object.assign(produs, dateFavorite.get(produs.id) || { numar_favorite: 0, este_favorit: false });
    // Etapa 6 – Bonus 9: Imagini multiple pentru produs.
    produs.imagini = imaginiProduse.obtineImaginiProdus(produs.imagine);
    const seturi = await accesProduse.obtineSeturi(produs.id);
    res.render("pagini/produs", { ip: req.ip, produs: produs, produseSimilare: produseSimilare, seturi: seturi });
  } catch (eroare) {
    console.error("Eroare la afisarea produsului: " + eroare.message);
    afisareEroare(res);
  }
});

// Etapa 6 – Bonus 17: Seturi de produse și reducere.
app.get("/seturi", async function (req, res) {
  try { res.render("pagini/seturi", { ip: req.ip, seturi: await accesProduse.obtineSeturi() }); }
  catch (eroare) { console.error("Eroare seturi: " + eroare.message); afisareEroare(res); }
});

// Etapa 6 – Bonus 10a: Filtrare pe server.
app.get("/api/produse-filtrate", async function (req, res) {
  try {
    const categorie = obGlobal.categoriiProduse.some((item) => item.valoare === req.query.categorie) ? req.query.categorie : "";
    const randuri = await accesProduse.obtineProduseFiltrate({ nume: String(req.query.nume || "").slice(0, 120), scor: req.query.scor, categorie, cheie1: req.query.cheie1, cheie2: req.query.cheie2, sens: req.query.sens });
    res.json({ ids: randuri.map((rand) => rand.id) });
  } catch (eroare) { res.status(400).json({ eroare: eroare.message }); }
});

// Etapa 6 – Bonus 20: Compararea produselor.
app.get("/comparare", async function (req, res) {
  const ids = String(req.query.ids || "").split(",").map((valoare) => Number.parseInt(valoare, 10)).filter((id) => Number.isInteger(id) && id > 0).slice(0, 2);
  if (ids.length !== 2) return afisareEroare(res, 400, "Comparație incompletă", "Selectează exact două produse.");
  try {
    const produse = await accesProduse.obtineProduseDupaIduri(ids);
    if (produse.length !== 2) return afisareEroare(res, 404);
    res.render("pagini/comparare", { ip: req.ip, produse: produse });
  } catch (eroare) {
    console.error("Eroare comparatie: " + eroare.message);
    afisareEroare(res);
  }
});

// Etapa 4 – Cerința 15: Configurarea pagina.
app.get("/despre", function (req, res) {
  res.render("pagini/despre", { ip: req.ip });
});

// Etapa 4 – Cerința 9 și 10: Configurarea pagina.
app.get("/*", function (req, res) {
  let pagina = req.params[0];

  // Unele cai (de exemplu cele cu extensia .html) fac ca express sa caute un motor
  // de randare inexistent si sa arunce eroarea sincron, inainte de callback. Folosim
  // try/catch ca serverul sa nu crashe, ci sa afiseze pagina de eroare 404.
  try {
    res.render(
      "pagini/" + pagina,
      { ip: req.ip },
      function (eroare, rezultatRandare) {
        if (eroare) {
          if (eroare.message.startsWith("Failed to lookup view")) {
            afisareEroare(res, 404);
          } else {
            afisareEroare(res);
          }
        } else {
          res.send(rezultatRandare);
        }
      },
    );
  } catch (eroare) {
    afisareEroare(res, 404);
  }
});

// Etapa 4 – Cerința 2: Configurarea serverului Express.
Promise.all([pregatesteMiniaturiGalerie(), imaginiProduse.pregatesteVariante(), initProduse()])
  .then(function () {
    app.listen(port, function () {
      console.log("Serverul PC Forge ruleaza la adresa http://localhost:" + port);
    });
  })
  .catch(function (eroare) {
    console.error("Aplicatia nu a putut fi initializata: " + eroare.message);
    process.exitCode = 1;
  });

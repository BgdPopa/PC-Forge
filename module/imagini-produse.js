// Etapa 6 – Bonus 9: Imagini multiple pentru produs.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const folderProiect = path.join(__dirname, "..");
const folderOriginale = path.join(folderProiect, "resurse", "imagini", "galerie", "originale");
const folderVariante = path.join(folderProiect, "resurse", "imagini", "produse-variante");
const extensiiAcceptate = new Set([".jpg", ".jpeg", ".png", ".webp"]);

/**
 * Construieste numele public al unei variante pornind din imaginea principala.
 * @param {string} calePrincipala Calea salvata in tabela produse.
 * @param {string} sufix Tipul cadrului generat.
 * @returns {string} Calea HTTP a imaginii derivate.
 */
function caleVarianta(calePrincipala, sufix) {
  const baza = path.parse(String(calePrincipala)).name;
  return `/resurse/imagini/produse-variante/${baza}-${sufix}.webp`;
}

/* Etapa 6 – Bonus 9: Imagini multiple pentru produs. */
async function pregatesteVariante() {
  fs.mkdirSync(folderVariante, { recursive: true });
  const fisiere = fs.readdirSync(folderOriginale).filter((nume) =>
    extensiiAcceptate.has(path.extname(nume).toLowerCase()),
  );

  for (const nume of fisiere) {
    const sursa = path.join(folderOriginale, nume);
    const baza = path.parse(nume).name;
    const variante = [
      {
        destinatie: path.join(folderVariante, `${baza}-detaliu.webp`),
        transforma: (pipeline) => pipeline.resize(900, 650, { fit: "cover", position: "attention" }),
      },
      {
        destinatie: path.join(folderVariante, `${baza}-complet.webp`),
        transforma: (pipeline) => pipeline.resize(900, 650, { fit: "contain", background: "#f4f4f6" }),
      },
    ];

    for (const varianta of variante) {
      const trebuieGenerata =
        !fs.existsSync(varianta.destinatie) ||
        fs.statSync(sursa).mtimeMs > fs.statSync(varianta.destinatie).mtimeMs;
      if (trebuieGenerata) {
        await varianta.transforma(sharp(sursa)).webp({ quality: 88 }).toFile(varianta.destinatie);
      }
    }
  }
}

/**
 * Returneaza imaginea principala si cele doua cadre generate ale aceluiasi produs.
 * @param {string} calePrincipala Calea imaginii produsului din PostgreSQL.
 * @returns {string[]} Cele trei imagini folosite de caruselul Bootstrap.
 */
function obtineImaginiProdus(calePrincipala) {
  return [
    calePrincipala,
    caleVarianta(calePrincipala, "detaliu"),
    caleVarianta(calePrincipala, "complet"),
  ];
}

module.exports = { pregatesteVariante, obtineImaginiProdus };

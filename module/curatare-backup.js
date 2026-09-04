// Etapa 6 – Bonus 13: Curățarea backupurilor CSS.
const fs = require("fs");
const path = require("path");

/**
 * Sterge numai fisierele CSS mai vechi decat perioada configurata.
 * Folderul tinta este construit intern, nu primit din browser, astfel incat
 * operatia ramane limitata la subfolderul backup/resurse/css.
 * @param {object} optiuni Configuratia operatiei.
 * @param {string} optiuni.folderBackup Folderul radacina al backupurilor.
 * @param {number} optiuni.minutePastrare Perioada de pastrare in minute.
 * @param {number} [optiuni.acum=Date.now()] Moment injectabil pentru testare.
 * @returns {number} Numarul fisierelor eliminate.
 */
function curataBackupuriCssVechi({
  folderBackup,
  minutePastrare,
  acum = Date.now(),
}) {
  const folderBackupCss = path.resolve(folderBackup, "resurse", "css");
  const minuteValide = Number(minutePastrare);

  if (!Number.isFinite(minuteValide) || minuteValide <= 0) {
    throw new TypeError("minutePastrareBackupCss trebuie sa fie un numar pozitiv.");
  }
  if (!fs.existsSync(folderBackupCss)) return 0;

  const limitaVechime = acum - minuteValide * 60 * 1000;
  let numarSterse = 0;

  function parcurge(caleFolder) {
    for (const intrare of fs.readdirSync(caleFolder, { withFileTypes: true })) {
      const caleIntrare = path.join(caleFolder, intrare.name);
      if (intrare.isDirectory()) {
        parcurge(caleIntrare);
      } else if (
        intrare.isFile() &&
        path.extname(intrare.name).toLowerCase() === ".css" &&
        fs.statSync(caleIntrare).mtimeMs < limitaVechime
      ) {
        fs.unlinkSync(caleIntrare);
        numarSterse++;
        console.log(`[Etapa 6 - Bonus 13] Backup expirat sters: ${caleIntrare}`);
      }
    }
  }

  parcurge(folderBackupCss);
  return numarSterse;
}

/**
 * Porneste verificarea imediata si apoi o repeta la fiecare minut.
 * @param {object} optiuni Configuratia serviciului.
 * @param {string} optiuni.folderBackup Folderul radacina al backupurilor.
 * @param {string} optiuni.caleOptiuniServer Fisierul JSON cu perioada de pastrare.
 * @returns {NodeJS.Timeout} Timerul neblocant al verificarii periodice.
 */
function porneste({ folderBackup, caleOptiuniServer }) {
  function executa() {
    try {
      const configuratie = JSON.parse(fs.readFileSync(caleOptiuniServer, "utf8"));
      return curataBackupuriCssVechi({
        folderBackup,
        minutePastrare: Number(configuratie.minutePastrareBackupCss || 43200),
      });
    } catch (eroare) {
      console.error(`[Etapa 6 - Bonus 13] Curatarea nu a putut rula: ${eroare.message}`);
      return 0;
    }
  }

  executa();
  const interval = setInterval(executa, 60 * 1000);
  interval.unref();
  return interval;
}

module.exports = { curataBackupuriCssVechi, porneste };

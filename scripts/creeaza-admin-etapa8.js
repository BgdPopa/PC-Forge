// Etapa 8 - cont local de administrator pentru prezentarea si testarea proiectului.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const AccesBD = require("../module/acces-bd");
const Utilizator = require("../module/utilizator");
const { genereazaSalt, cripteazaParola } = require("../module/securitate");

/** Creeaza administratorul demonstrativ numai daca nu exista deja. */
async function creeazaAdministrator() {
  const username = process.env.DEMO_ADMIN_USERNAME || "admin_pcforge";
  const parolaClara = process.env.DEMO_ADMIN_PASSWORD || "Admin!2026Forge";
  const existent = await Utilizator.cautaDupaUsername(username);
  if (existent) {
    console.log(`Administratorul ${username} exista deja.`);
    return;
  }
  const salt = genereazaSalt();
  const admin = new Utilizator({
    username,
    nume: "PC Forge",
    prenume: "Administrator",
    email: "admin@pcforge.local",
    parola: cripteazaParola(parolaClara, salt),
    salt,
    data_nasterii: "2000-01-01",
    rol: "admin",
    confirmat_mail: true,
  });
  await admin.salvareUtilizator();
  console.log(`Administrator creat: ${username}`);
}

creeazaAdministrator()
  .catch((eroare) => {
    console.error(eroare.message);
    process.exitCode = 1;
  })
  .finally(() => AccesBD.getInstanta().getClient().end());

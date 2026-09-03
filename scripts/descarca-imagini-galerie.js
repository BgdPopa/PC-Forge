/*
 * Descarca imaginile cu licenta libera folosite de galeria PC Forge.
 * Sursele si licentele sunt pastrate si in resurse/json/galerie.json.
 */
const fs = require("fs");
const path = require("path");

const imagini = [
  ["Desktop Computer Motherboard.jpg", "placa-baza-desktop.jpg"],
  ["Memory modules.jpg", "module-memorie.jpg"],
  ["MSATA SSD 16 GB Sandisk - SDSA3DD-016G-2494.jpg", "ssd-msata.jpg"],
  ["Computer case 20170910.jpg", "carcasa-pc.jpg"],
  ["Matrox graphics card.jpg", "placa-video-matrox.jpg"],
  ["CPU cooler.png", "cooler-procesor.png"],
  ["Computer Keyboard.jpg", "tastatura.jpg"],
  ["Computer Mouse (41561447025).jpg", "mouse.jpg"],
  ["Computer monitor.jpg", "monitor.jpg"],
  ["Fans from computer case - front and back - 2018-05-22.jpg", "ventilatoare-carcasa.jpg"],
  ["Original AT motherboard.jpg", "placa-baza-at.jpg"],
  ["Mini-itx-motherboard.jpg", "placa-baza-mini-itx.jpg"],
];

const folderDestinatie = path.join(
  __dirname,
  "..",
  "resurse",
  "imagini",
  "galerie",
  "originale",
);

fs.mkdirSync(folderDestinatie, { recursive: true });

async function descarcaImagine(titluCommons, numeFisier) {
  const destinatie = path.join(folderDestinatie, numeFisier);

  if (fs.existsSync(destinatie) && fs.statSync(destinatie).size > 1000) {
    console.log(`Existent: ${numeFisier}`);
    return;
  }

  const url =
    "https://commons.wikimedia.org/wiki/Special:Redirect/file/" +
    encodeURIComponent(titluCommons) +
    "?width=1600";

  let raspuns;

  for (let incercare = 1; incercare <= 5; incercare++) {
    raspuns = await fetch(url, {
      headers: {
        "User-Agent": "PC-Forge-Educational-Project/1.0 (student project)",
      },
    });

    if (raspuns.status !== 429) {
      break;
    }

    const pauza = incercare * 5000;
    console.log(`Limită temporară Wikimedia; reîncerc în ${pauza / 1000}s...`);
    await new Promise((rezolva) => setTimeout(rezolva, pauza));
  }

  if (!raspuns.ok) {
    throw new Error(`${raspuns.status} ${raspuns.statusText}: ${titluCommons}`);
  }

  const continut = Buffer.from(await raspuns.arrayBuffer());
  fs.writeFileSync(destinatie, continut);
  console.log(`Descarcat: ${numeFisier}`);
}

async function main() {
  for (const [titluCommons, numeFisier] of imagini) {
    await descarcaImagine(titluCommons, numeFisier);
    await new Promise((rezolva) => setTimeout(rezolva, 2500));
  }
}

main().catch((eroare) => {
  console.error(eroare.message);
  process.exitCode = 1;
});

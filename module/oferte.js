// Etapa 6 – Bonus 12: Oferte periodice.
const fs = require("fs");
const path = require("path");
const accesProduse = require("./acces-produse");
const cale = path.join(__dirname, "..", "resurse", "json", "oferte.json");
const intervalOfertaMs = 5 * 60 * 1000;
const pastrareIstoricMs = 60 * 60 * 1000;
function citeste() { try { return JSON.parse(fs.readFileSync(cale, "utf8")); } catch { return { oferte: [] }; } }
function scrie(date) { fs.writeFileSync(cale, JSON.stringify(date, null, 2)); }
/** @returns {Promise<object>} Oferta activa sau nou generata. */
async function actualizeazaOferta() {
  const date = citeste(); const acum = Date.now(); const curenta = date.oferte[0];
  if (!curenta || new Date(curenta["data-finalizare"]).getTime() <= acum) {
    const categorii = await accesProduse.obtineCategorii();
    const eligibile = categorii.filter((categorie) => categorie !== curenta?.categorie);
    const reduceri = [5,10,15,20,25,30,35,40,45,50];
    date.oferte.unshift({ categorie: eligibile[Math.floor(Math.random() * eligibile.length)], "data-incepere": new Date(acum).toISOString(), "data-finalizare": new Date(acum + intervalOfertaMs).toISOString(), reducere: reduceri[Math.floor(Math.random() * reduceri.length)] });
  }
  // Etapa 6 – Bonus 12e: Oferte periodice.
  date.oferte = date.oferte.filter((oferta, index) => index === 0 || new Date(oferta["data-finalizare"]).getTime() >= acum - pastrareIstoricMs);
  scrie(date); return date.oferte[0];
}
function obtineOfertaCurenta() { const oferta = citeste().oferte[0]; return oferta && new Date(oferta["data-finalizare"]) > new Date() ? oferta : null; }
function porneste() { actualizeazaOferta().catch(console.error); setInterval(() => actualizeazaOferta().catch(console.error), intervalOfertaMs).unref(); }
module.exports = { porneste, obtineOfertaCurenta, actualizeazaOferta };

// Etapa 8 - Bonus 1: fiecare parola foloseste un salt aleator propriu.
const crypto = require("crypto");

/**
 * Genereaza un salt criptografic aleator.
 * @returns {string} Salt hexadecimal de 32 bytes.
 */
function genereazaSalt() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Deriva cheia parolei cu scrypt si saltul utilizatorului.
 * @param {string} parola Parola in clar, existenta numai in memorie.
 * @param {string} salt Salt-ul salvat separat pentru utilizator.
 * @returns {string} Hash hexadecimal.
 */
function cripteazaParola(parola, salt) {
  return crypto.scryptSync(parola, salt, 64).toString("hex");
}

/**
 * Compara in timp constant parola primita cu hash-ul salvat.
 * @param {string} parola Parola introdusa.
 * @param {string} salt Salt-ul utilizatorului.
 * @param {string} hashSalvat Hash-ul din baza.
 * @returns {boolean} True numai daca parola corespunde.
 */
function verificaParola(parola, salt, hashSalvat) {
  if (!parola || !salt || !hashSalvat) return false;
  const calculat = Buffer.from(cripteazaParola(parola, salt), "hex");
  const salvat = Buffer.from(hashSalvat, "hex");
  return calculat.length === salvat.length && crypto.timingSafeEqual(calculat, salvat);
}

/** @returns {string} Token URL-safe folosit la confirmarea adresei de e-mail. */
function genereazaToken() {
  return crypto.randomBytes(24).toString("base64url");
}

module.exports = { genereazaSalt, cripteazaParola, verificaParola, genereazaToken };

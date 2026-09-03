// Etapa 8 - serviciu unic pentru e-mailurile de confirmare si administrare.
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const areSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
const transport = areSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE) === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    })
  : nodemailer.createTransport({ jsonTransport: true });

/**
 * Trimite e-mailul prin SMTP sau il salveaza in log in modul demonstrativ.
 * @param {object} mesaj Optiunile acceptate de nodemailer.sendMail().
 * @returns {Promise<object>} Rezultatul Nodemailer.
 */
async function trimite(mesaj) {
  const rezultat = await transport.sendMail({
    from: process.env.SMTP_FROM || "PC Forge <noreply@pcforge.local>",
    ...mesaj,
  });
  if (!areSmtp) {
    const folderLog = path.join(__dirname, "..", "logs");
    fs.mkdirSync(folderLog, { recursive: true });
    fs.appendFileSync(
      path.join(folderLog, "emailuri-etapa8.log"),
      `${new Date().toISOString()} ${JSON.stringify({ to: mesaj.to, subject: mesaj.subject, text: mesaj.text })}\n`,
    );
  }
  return rezultat;
}

module.exports = { trimite, transport, modDemonstrativ: !areSmtp };

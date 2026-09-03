// Etapa 8 - Bonus 12: mesajul fix dispare automat dupa trei secunde.
document.addEventListener("DOMContentLoaded", function () {
  const mesaj = document.getElementById("mesaj-site-actualizat");
  if (mesaj) window.setTimeout(() => mesaj.remove(), 3000);
});

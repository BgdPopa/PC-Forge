// Etapa 8 – Bonus 12: Indicatorul ultimei actualizări.
document.addEventListener("DOMContentLoaded", function () {
  const mesaj = document.getElementById("mesaj-site-actualizat");
  if (mesaj) window.setTimeout(() => mesaj.remove(), 3000);
});

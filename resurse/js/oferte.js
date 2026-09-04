// Etapa 6 – Bonus 12c: Oferte periodice.
document.addEventListener("DOMContentLoaded", function () {
  const oferta = document.getElementById("oferta-curenta"); if (!oferta) return;
  const output = document.getElementById("temporizator-oferta");
  function actualizeaza() { const secunde = Math.max(0, Math.ceil((new Date(oferta.dataset.expira).getTime() - Date.now()) / 1000)); const minute = Math.floor(secunde / 60); const rest = secunde % 60; output.textContent = `${String(minute).padStart(2,"0")}:${String(rest).padStart(2,"0")}`; output.classList.toggle("oferta-expira", secunde <= 10); if (secunde === 0) window.location.reload(); }
  actualizeaza(); setInterval(actualizeaza, 1000);
});

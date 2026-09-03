// Etapa 6 - Bonus 19: panou de program fara navigare, cu stare calculata dupa
// ziua si ora curenta, evidentierea zilei si inchidere automata.
function initializeazaOrar() {
  const buton = document.getElementById("btn-orar");
  const panou = document.getElementById("panou-orar");
  const inchide = document.getElementById("inchide-orar");
  const stare = document.getElementById("stare-orar");
  if (!buton || !panou || !inchide || !stare) return;

  let temporizator;

  function actualizeazaStare() {
    const acum = new Date();
    const rand = panou.querySelector(`[data-zi="${acum.getDay()}"]`);
    panou.querySelectorAll("tbody tr").forEach((element) => element.classList.remove("zi-curenta"));
    if (!rand) return;
    rand.classList.add("zi-curenta");

    const minuteAcum = acum.getHours() * 60 + acum.getMinutes();
    const inMinute = (ora) => {
      const [ore, minute] = ora.split(":").map(Number);
      return ore * 60 + minute;
    };
    const esteDeschis = rand.dataset.inchis !== "true" &&
      minuteAcum >= inMinute(rand.dataset.deschidere) &&
      minuteAcum < inMinute(rand.dataset.inchidere);

    stare.className = `alert mb-3 ${esteDeschis ? "alert-success" : "alert-secondary"}`;
    stare.textContent = esteDeschis
      ? `Suntem deschisi acum, pana la ${rand.dataset.inchidere}.`
      : "Suntem inchisi acum. Consulta intervalele de mai jos.";
  }

  function ascundePanou() {
    window.clearTimeout(temporizator);
    panou.hidden = true;
    buton.setAttribute("aria-expanded", "false");
  }

  function afiseazaPanou() {
    actualizeazaStare();
    panou.hidden = false;
    buton.setAttribute("aria-expanded", "true");
    window.clearTimeout(temporizator);
    temporizator = window.setTimeout(ascundePanou, 12000);
  }

  buton.addEventListener("click", function () {
    if (panou.hidden) afiseazaPanou();
    else ascundePanou();
  });
  inchide.addEventListener("click", ascundePanou);
}

// Etapa 6 - Bonus 19: initializarea functioneaza si daca fisierul este incarcat
// dupa evenimentul DOMContentLoaded (de exemplu din cache sau dintr-un fragment).
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeazaOrar);
} else {
  initializeazaOrar();
}

// Etapa 6 - task tema light/dark:
// tema se memoreaza in localStorage si se aplica pe toate paginile site-ului.
(function () {
  const cheieTema = "pc-forge-tema";
  const temaServer = window.pcForgeUtilizator?.tema;
  const temaSalvata = temaServer || localStorage.getItem(cheieTema);
  // Etapa 6 - Bonus 2: sunt acceptate trei teme persistente.
  const temaInitiala = ["light", "dark", "contrast"].includes(temaSalvata) ? temaSalvata : "light";

  function aplicaTema(tema) {
    document.documentElement.dataset.tema = tema;
    const comutator = document.getElementById("comutator-tema");
    const selector = document.getElementById("selector-tema");
    if (selector) selector.value = tema;
    if (comutator) {
      comutator.checked = tema === "dark";
      comutator.setAttribute("aria-label", tema === "dark" ? "Activează tema luminoasă" : "Activează tema întunecată");
    }
  }

  aplicaTema(temaInitiala);
  const comutator = document.getElementById("comutator-tema");
  const selector = document.getElementById("selector-tema");
  function memoreazaTema(tema) {
    localStorage.setItem(cheieTema, tema);
    aplicaTema(tema);
    if (window.pcForgeUtilizator) fetch("/api/tema", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tema: tema }) });
  }
  if (comutator) {
    comutator.addEventListener("change", function () {
      const tema = comutator.checked ? "dark" : "light";
      memoreazaTema(tema);
    });
  }
  if (selector) selector.addEventListener("change", () => memoreazaTema(selector.value));
})();

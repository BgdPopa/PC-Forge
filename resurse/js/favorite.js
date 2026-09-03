// Etapa 8 - Bonus 13: favorite prin fetch si actualizarea periodica a contoarelor.
document.addEventListener("DOMContentLoaded", function () {
  async function comutaFavorit(buton) {
    const card = buton.closest("[data-produs-id]");
    const id = buton.dataset.produsId || card?.dataset.produsId;
    const raspuns = await fetch(`/api/favorite/${id}`, { method: "POST" });
    if (!raspuns.ok) return;
    const rezultat = await raspuns.json();
    buton.classList.toggle("btn-danger", rezultat.esteFavorit);
    buton.classList.toggle("btn-outline-danger", !rezultat.esteFavorit);
    buton.setAttribute("aria-pressed", String(rezultat.esteFavorit));
    const icon = buton.querySelector("i");
    if (icon) icon.className = `bi bi-heart${rezultat.esteFavorit ? "-fill" : ""}`;
    actualizeazaContoare();
  }
  document.addEventListener("click", (eveniment) => { const buton = eveniment.target.closest(".actiune-favorit"); if (buton) comutaFavorit(buton); });
  async function actualizeazaContoare() {
    const elemente = [...document.querySelectorAll("[data-favorite-id]")];
    const ids = [...new Set(elemente.map((element) => element.dataset.favoriteId))];
    if (!ids.length) return;
    const raspuns = await fetch(`/api/favorite-numere?ids=${ids.join(",")}`);
    if (!raspuns.ok) return;
    const date = await raspuns.json();
    elemente.forEach((element) => { const span = element.querySelector("span"); if (span) span.textContent = date[element.dataset.favoriteId] || 0; });
  }
  actualizeazaContoare();
  setInterval(actualizeazaContoare, 5000);
});

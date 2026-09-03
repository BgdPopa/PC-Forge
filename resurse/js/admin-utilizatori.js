// Etapa 8 - cerinta 9: blocarea/deblocarea se face asincron prin fetch.
document.addEventListener("click", async function (eveniment) {
  const buton = eveniment.target.closest(".btn-blocare");
  if (!buton) return;
  const rand = buton.closest("tr");
  buton.disabled = true;
  const raspuns = await fetch(`/api/utilizatori/${rand.dataset.id}/blocare`, { method: "POST", headers: { "Content-Type": "application/json" } });
  const rezultat = await raspuns.json();
  if (rezultat.succes) {
    rand.querySelector(".stare-blocat").textContent = rezultat.blocat ? "Da" : "Nu";
    buton.textContent = rezultat.blocat ? "Deblochează" : "Blochează";
    buton.className = `btn btn-sm ${rezultat.blocat ? "btn-success" : "btn-danger"} btn-blocare`;
  }
  buton.disabled = false;
});

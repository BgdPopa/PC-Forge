// Etapa 7 – Cerință: Drepturile utilizatorilor.
const Drepturi = Object.freeze({
  vizualizareProduse: Symbol("vizualizare produse"),
  cumparareProduse: Symbol("cumparare produse"),
  adaugareProduse: Symbol("adaugare produse"),
  modificareProduse: Symbol("modificare produse"),
  stergereProduse: Symbol("stergere produse"),
  vizualizareUtilizatori: Symbol("vizualizare utilizatori"),
  administrareUtilizatori: Symbol("administrare utilizatori"),
  stergereUtilizatori: Symbol("stergere utilizatori"),
  alocareRoluri: Symbol("alocare roluri"),
});

module.exports = Drepturi;

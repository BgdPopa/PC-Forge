// Etapa 7 - obiectul Drepturi (cerinta 0.05p):
// simbolurile nu pot fi falsificate prin simpla folosire a aceluiasi text.
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

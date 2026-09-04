// Etapa 8 – Cerința 3: Funcția valideaza.
document.addEventListener("DOMContentLoaded", function () {
  const formular = document.getElementById("formular-inregistrare");
  if (!formular) return;
  const parola = document.getElementById("parola");
  const confirmare = document.getElementById("confirmare_parola");
  const email = document.getElementById("email");

  /** Seteaza mesajele de validare personalizate ale formularului. */
  function valideaza() {
    confirmare.setCustomValidity(parola.value === confirmare.value ? "" : "Parolele nu coincid.");
    parola.setCustomValidity(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(parola.value) ? "" : "Folosește minimum 8 caractere, literă mare, literă mică și cifră.");
    email.setCustomValidity(/^[A-Za-z0-9_-]+@[A-Za-z0-9]+\.[A-Za-z]{2,3}$/.test(email.value) ? "" : "E-mailul trebuie să respecte formatul cerut.");
  }
  [parola, confirmare, email].forEach((camp) => camp.addEventListener("input", valideaza));
  formular.addEventListener("submit", function (eveniment) {
    valideaza();
    if (!formular.checkValidity()) { eveniment.preventDefault(); formular.classList.add("was-validated"); }
  });
});

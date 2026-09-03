// Etapa 8 - cerinta 12: lista administratorilor activi se actualizeaza prin fetch.
(function () {
  const lista = document.getElementById("lista-admini-online");
  if (!lista) return;
  /** Cere serverului administratorii activi in ultimele zece minute. */
  async function actualizeazaAdminiOnline() {
    const raspuns = await fetch("/api/admini-online");
    const admini = await raspuns.json();
    lista.replaceChildren();
    if (!admini.length) {
      const li = document.createElement("li"); li.textContent = "Niciun administrator online momentan."; lista.append(li); return;
    }
    admini.forEach(function (admin) {
      const li = document.createElement("li");
      li.append(`${admin.username} `);
      const link = document.createElement("a"); link.href = `mailto:${admin.email}`; link.textContent = admin.email;
      li.append(link); lista.append(li);
    });
  }
  actualizeazaAdminiOnline();
  window.setInterval(actualizeazaAdminiOnline, 60 * 60 * 1000);
})();

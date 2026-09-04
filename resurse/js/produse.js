// Etapa 6 – Cerință: Filtrarea produselor.
document.addEventListener("DOMContentLoaded", function () {
  const lista = document.getElementById("lista-produse");
  if (!lista) return;

  const produse = Array.from(lista.querySelectorAll(".produs-card"));
  const inpNume = document.getElementById("inp-nume");
  const inpScor = document.getElementById("inp-scor");
  const valoareScor = document.getElementById("valoare-scor");
  const inpCuloare = document.getElementById("inp-culoare");
  const inpDescriere = document.getElementById("inp-descriere");
  const selectSubcategorie = document.getElementById("select-subcategorie");
  const selectConectivitate = document.getElementById("select-conectivitate");
  const mesajFaraProduse = document.getElementById("mesaj-fara-produse");
  const numarProduse = document.getElementById("numar-produse");
  const salveazaFiltre = document.getElementById("salveaza-filtre");
  const cheieFiltrePersistente = `pc-forge-filtre:${window.location.search}`;
  // Etapa 6 – Bonus 5: Paginare dinamică.
  const produsePePagina = 6;
  const cheieAscunseTab = "pc-forge-produse-ascunse-tab";
  const cheieComparatie = "pc-forge-comparatie";
  let paginaCurenta = 1;
  const ascunseTab = new Set(JSON.parse(sessionStorage.getItem(cheieAscunseTab) || "[]"));
  const culoriValide = Array.from(document.querySelectorAll("#lista-culori option")).map((optiune) => optiune.value.toLowerCase());

  // Etapa 7 – Cerința 16: Carduri Bootstrap animate.
  function animeazaCarduriBootstrap() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = 200;
    produse.forEach(function (produs, index) {
      produs.classList.add("produs-card--animat");
      window.setTimeout(function () {
        produs.classList.add("produs-card--vizibil");
      }, (index + 1) * t);
    });
  }

  // Etapa 6 – Bonus 7: Căutare fără diacritice.
  function normalizeazaText(text) {
    return text.toLocaleLowerCase("ro").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ș/g, "s").replace(/ț/g, "t");
  }

  // Etapa 6 – Cerință: Funcția valideazaInputuri.
  function valideazaInputuri(afiseazaMesaje) {
    const numeValid = /^[\p{L}\p{N}\s.+-]*$/u.test(inpNume.value.trim());
    inpNume.setCustomValidity(numeValid ? "" : "Numele conține simboluri nepermise.");
    inpNume.classList.toggle("is-invalid", !numeValid);

    const descriere = inpDescriere.value.trim();
    const descriereValida = descriere.length === 0 || descriere.length >= 3;
    inpDescriere.setCustomValidity(descriereValida ? "" : "Introdu minimum trei caractere.");
    inpDescriere.classList.toggle("is-invalid", !descriereValida);

    const culoare = inpCuloare.value.trim().toLowerCase();
    const culoareValida = culoare === "" || culoriValide.includes(culoare);
    inpCuloare.setCustomValidity(culoareValida ? "" : "Culoarea trebuie aleasă din listă.");
    inpCuloare.classList.toggle("is-invalid", !culoareValida);

    const valid = numeValid && descriereValida && culoareValida;
    if (!valid && afiseazaMesaje) {
      const primulInvalid = document.querySelector(".is-invalid");
      if (primulInvalid) primulInvalid.reportValidity();
    }
    return valid;
  }

  function valoriSelectate(selector) {
    return Array.from(document.querySelectorAll(selector)).filter((element) => element.checked).map((element) => element.value);
  }

  function optiuniMultiple(select) {
    return Array.from(select.selectedOptions).map((optiune) => optiune.value);
  }

  // Etapa 7 – Bonus 3: Filtre persistente.
  function obtineStareFiltre() {
    return {
      nume: inpNume.value,
      scor: inpScor.value,
      culoare: inpCuloare.value,
      stoc: document.querySelector('input[name="stoc"]:checked').value,
      categorii: valoriSelectate(".filtru-categorie"),
      descriere: inpDescriere.value,
      subcategorie: selectSubcategorie.value,
      conectivitate: optiuniMultiple(selectConectivitate),
    };
  }

  function salveazaStareFiltre() {
    if (salveazaFiltre.checked) {
      localStorage.setItem(cheieFiltrePersistente, JSON.stringify(obtineStareFiltre()));
    }
  }

  function restaureazaStareFiltre() {
    const stareSalvata = localStorage.getItem(cheieFiltrePersistente);
    if (!stareSalvata) return;
    try {
      const stare = JSON.parse(stareSalvata);
      inpNume.value = stare.nume || "";
      inpScor.value = stare.scor || inpScor.min;
      inpCuloare.value = stare.culoare || "";
      inpDescriere.value = stare.descriere || "";
      const radioStoc = document.querySelector(`input[name="stoc"][value="${stare.stoc || "toate"}"]`);
      if (radioStoc) radioStoc.checked = true;
      document.querySelectorAll(".filtru-categorie").forEach((element) => {
        element.checked = (stare.categorii || []).includes(element.value);
      });
      selectSubcategorie.value = stare.subcategorie || "";
      Array.from(selectConectivitate.options).forEach((optiune) => {
        optiune.selected = (stare.conectivitate || []).includes(optiune.value);
      });
      salveazaFiltre.checked = true;
    } catch (eroare) {
      localStorage.removeItem(cheieFiltrePersistente);
    }
  }

  // Etapa 6 – Cerință: Filtrarea produselor.
  function aplicaFiltrare(afiseazaMesaje = false) {
    valoareScor.value = inpScor.value;
    if (!valideazaInputuri(afiseazaMesaje)) return false;

    const filtru = {
      nume: normalizeazaText(inpNume.value.trim()),
      scor: Number(inpScor.value),
      culoare: inpCuloare.value.trim().toLowerCase(),
      stoc: document.querySelector('input[name="stoc"]:checked').value,
      categorii: valoriSelectate(".filtru-categorie"),
      descriere: normalizeazaText(inpDescriere.value.trim()),
      subcategorie: selectSubcategorie.value,
      conectivitate: optiuniMultiple(selectConectivitate),
    };

    let numarVizibile = 0;
    produse.forEach(function (produs) {
      const conexiuniProdus = JSON.parse(produs.dataset.conectivitate);
      const corespunde =
        normalizeazaText(produs.dataset.nume).includes(filtru.nume) &&
        Number(produs.dataset.scor) >= filtru.scor &&
        (!filtru.culoare || produs.dataset.culoare === filtru.culoare) &&
        (filtru.stoc === "toate" || (filtru.stoc === "da" && produs.dataset.stoc === "true") || (filtru.stoc === "nu" && produs.dataset.stoc === "false")) &&
        (filtru.categorii.length === 0 || filtru.categorii.includes(produs.dataset.categorie)) &&
        normalizeazaText(produs.dataset.descriere).includes(filtru.descriere) &&
        (!filtru.subcategorie || produs.dataset.subcategorie === filtru.subcategorie) &&
        (filtru.conectivitate.length === 0 || filtru.conectivitate.every((valoare) => conexiuniProdus.includes(valoare)));

      // Etapa 6 – Bonus 6: Fixarea și ascunderea produselor.
      produs.dataset.ascunsTemporar = "false";
      const eligibil = (corespunde || produs.classList.contains("produs-card--fixat")) && !ascunseTab.has(produs.dataset.produsId);
      produs.dataset.corespunde = String(eligibil);
      if (eligibil) numarVizibile++;
    });

    // Etapa 6 – Bonusurile 3 și 15: Mesaj pentru zero rezultate.
    mesajFaraProduse.hidden = numarVizibile !== 0;
    numarProduse.textContent = `${numarVizibile} ${numarVizibile === 1 ? "produs" : "produse"}`;
    paginaCurenta = 1;
    actualizeazaPaginare();
    salveazaStareFiltre();
    return true;
  }

  // Etapa 6 – Bonus 5: Paginare dinamică.
  function actualizeazaPaginare() {
    const eligibile = produse.filter((produs) => produs.dataset.corespunde === "true" && produs.dataset.ascunsTemporar !== "true");
    const numarPagini = Math.max(1, Math.ceil(eligibile.length / produsePePagina));
    paginaCurenta = Math.min(paginaCurenta, numarPagini);
    produse.forEach((produs) => { produs.hidden = true; });
    eligibile.slice((paginaCurenta - 1) * produsePePagina, paginaCurenta * produsePePagina).forEach((produs) => { produs.hidden = false; });
    const container = document.getElementById("paginare-produse");
    container.replaceChildren();
    if (numarPagini <= 1) return;
    for (let pagina = 1; pagina <= numarPagini; pagina++) {
      const element = document.createElement("li");
      element.className = `page-item${pagina === paginaCurenta ? " active" : ""}`;
      const buton = document.createElement("button");
      buton.className = "page-link";
      buton.type = "button";
      buton.textContent = pagina;
      buton.setAttribute("aria-label", `Pagina ${pagina}`);
      buton.addEventListener("click", () => { paginaCurenta = pagina; actualizeazaPaginare(); document.getElementById("titlu-lista-produse").scrollIntoView({ behavior: "smooth" }); });
      element.append(buton);
      container.append(element);
    }
  }

  function valoareSortare(produs, cheie) {
    if (cheie === "raport") return Number(produs.dataset.scor) / Number(produs.dataset.pret);
    if (cheie === "pret" || cheie === "scor") return Number(produs.dataset[cheie]);
    return normalizeazaText(produs.dataset[cheie]);
  }

  function comparaValori(a, b) {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b), "ro", { numeric: true });
  }

  // Etapa 6 – Bonus 8: Sortare după două chei.
  function sorteazaProduse(sens) {
    if (!valideazaInputuri(true)) return;
    const cheie1 = document.getElementById("cheie-sortare-1").value;
    const cheie2 = document.getElementById("cheie-sortare-2").value;
    const sortate = [...produse].sort(function (produsA, produsB) {
      const primaComparatie = comparaValori(valoareSortare(produsA, cheie1), valoareSortare(produsB, cheie1));
      if (primaComparatie !== 0) return primaComparatie * sens;
      return comparaValori(valoareSortare(produsA, cheie2), valoareSortare(produsB, cheie2)) * sens;
    });
    sortate.forEach((produs) => lista.append(produs));
    produse.forEach((produs) => { produs.dataset.ascunsTemporar = "false"; });
    actualizeazaPaginare();
  }

  // Etapa 6 – Cerință: Funcția calculeazaPreturi.
  function calculeazaPreturi() {
    if (!valideazaInputuri(true)) return;
    const preturi = produse.filter((produs) => !produs.hidden).map((produs) => Number(produs.dataset.pret));
    if (!preturi.length) {
      afiseazaCalcul("Nu există produse pentru calcul.");
      return;
    }
    const tip = document.getElementById("tip-calcul").value;
    const suma = preturi.reduce((total, pret) => total + pret, 0);
    const rezultate = { suma: suma, medie: suma / preturi.length, minim: Math.min(...preturi), maxim: Math.max(...preturi) };
    const etichete = { suma: "Suma", medie: "Media", minim: "Minimul", maxim: "Maximul" };
    afiseazaCalcul(`${etichete[tip]} prețurilor: ${rezultate[tip].toFixed(2)} lei`);
  }

  function afiseazaCalcul(text) {
    document.querySelectorAll(".rezultat-calcul").forEach((element) => element.remove());
    const rezultat = document.createElement("div");
    rezultat.className = "rezultat-calcul alert alert-light";
    rezultat.setAttribute("role", "status");
    rezultat.textContent = text;
    document.body.append(rezultat);
    setTimeout(() => rezultat.remove(), 2000);
  }

  // Etapa 6 – Cerință: Funcția reseteazaFiltre.
  function reseteazaFiltre() {
    if (!window.confirm("Dorești să resetezi toate filtrele și sortarea?")) return;
    inpNume.value = "";
    inpScor.value = inpScor.min;
    inpCuloare.value = "";
    inpDescriere.value = "";
    document.getElementById("stoc-toate").checked = true;
    document.querySelectorAll(".filtru-categorie").forEach((element) => { element.checked = false; });
    selectSubcategorie.value = "";
    Array.from(selectConectivitate.options).forEach((optiune) => { optiune.selected = false; });
    document.getElementById("cheie-sortare-1").value = "raport";
    document.getElementById("cheie-sortare-2").value = "subcategorie";
    document.getElementById("tip-calcul").value = "suma";
    salveazaFiltre.checked = false;
    localStorage.removeItem(cheieFiltrePersistente);
    [inpNume, inpCuloare, inpDescriere].forEach((element) => { element.setCustomValidity(""); element.classList.remove("is-invalid"); });
    [...produse].sort((a, b) => Number(a.dataset.indexInitial) - Number(b.dataset.indexInitial)).forEach((produs) => lista.append(produs));
    produse.forEach((produs) => { produs.classList.remove("produs-card--fixat"); produs.dataset.ascunsTemporar = "false"; });
    aplicaFiltrare();
  }

  // Etapa 6 – Bonus 6: Fixarea și ascunderea produselor.
  lista.addEventListener("click", function (eveniment) {
    const card = eveniment.target.closest(".produs-card");
    if (!card) return;
    const fixare = eveniment.target.closest(".actiune-fixare");
    const ascundere = eveniment.target.closest(".actiune-ascundere");
    const sesiune = eveniment.target.closest(".actiune-sesiune");
    if (fixare) {
      card.classList.toggle("produs-card--fixat");
      fixare.classList.toggle("btn-primary", card.classList.contains("produs-card--fixat"));
      fixare.classList.toggle("btn-outline-primary", !card.classList.contains("produs-card--fixat"));
      aplicaFiltrare();
    } else if (ascundere) {
      card.dataset.ascunsTemporar = "true";
      actualizeazaPaginare();
    } else if (sesiune) {
      ascunseTab.add(card.dataset.produsId);
      sessionStorage.setItem(cheieAscunseTab, JSON.stringify([...ascunseTab]));
      aplicaFiltrare();
    }
  });

  // Etapa 6 – Bonus 11: Modal Bootstrap.
  lista.addEventListener("click", function (eveniment) {
    if (eveniment.target.closest("a, button, input, select, label")) return;
    const card = eveniment.target.closest(".produs-card");
    if (!card || !window.bootstrap) return;
    document.getElementById("modal-produs-titlu").textContent = card.dataset.nume;
    document.getElementById("modal-produs-continut").innerHTML = `<img class="img-fluid rounded mb-3" src="${card.dataset.imagine}" alt=""><p>${card.dataset.descriere}</p><dl class="row mb-0"><dt class="col-5">Categorie</dt><dd class="col-7">${card.dataset.categorie}</dd><dt class="col-5">Performanță</dt><dd class="col-7">${card.dataset.scor}/100</dd><dt class="col-5">Preț</dt><dd class="col-7">${Number(card.dataset.pret).toFixed(2)} lei</dd></dl>`;
    document.getElementById("modal-produs-link").href = `/produs/${card.dataset.produsId}`;
    window.bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-produs")).show();
  });

  // Etapa 6 – Bonus 20: Compararea produselor.
  function citesteComparatie() {
    try {
      const stare = JSON.parse(localStorage.getItem(cheieComparatie) || "null");
      if (!stare || Date.now() - stare.actualizat > 24 * 60 * 60 * 1000) return [];
      return Array.isArray(stare.produse) ? stare.produse.slice(0, 2) : [];
    } catch { return []; }
  }
  function scrieComparatie(selectie) {
    localStorage.setItem(cheieComparatie, JSON.stringify({ actualizat: Date.now(), produse: selectie }));
    afiseazaComparatie();
  }
  function afiseazaComparatie() {
    const selectie = citesteComparatie();
    const container = document.getElementById("container-comparare");
    const listaComparare = document.getElementById("lista-comparare");
    container.hidden = selectie.length === 0;
    listaComparare.replaceChildren(...selectie.map((produs) => {
      const rand = document.createElement("span");
      rand.className = "comparatie-produs";
      rand.textContent = produs.nume;
      const sterge = document.createElement("button");
      sterge.type = "button"; sterge.className = "btn-close btn-close-white"; sterge.setAttribute("aria-label", `Șterge ${produs.nume}`);
      sterge.addEventListener("click", () => scrieComparatie(selectie.filter((item) => item.id !== produs.id)));
      rand.append(sterge); return rand;
    }));
    document.getElementById("afiseaza-comparatie").hidden = selectie.length !== 2;
    document.querySelectorAll(".actiune-comparare").forEach((buton) => { buton.disabled = selectie.length >= 2; buton.title = buton.disabled ? "Ștergeți un produs din lista de comparare" : "Adaugă produsul la comparație"; });
  }
  lista.addEventListener("click", function (eveniment) {
    const buton = eveniment.target.closest(".actiune-comparare");
    if (!buton) return;
    const card = buton.closest(".produs-card");
    const selectie = citesteComparatie();
    if (!selectie.some((produs) => produs.id === card.dataset.produsId) && selectie.length < 2) {
      selectie.push({ id: card.dataset.produsId, nume: card.dataset.nume });
      scrieComparatie(selectie);
    }
  });
  document.getElementById("goleste-comparatie").addEventListener("click", () => scrieComparatie([]));
  document.getElementById("afiseaza-comparatie").addEventListener("click", () => { const ids = citesteComparatie().map((produs) => produs.id).join(","); window.open(`/comparare?ids=${ids}`, "pc-forge-comparatie", "width=980,height=720"); });

  document.getElementById("btn-filtrare").addEventListener("click", () => aplicaFiltrare(true));
  // Etapa 6 – Bonus 10a: Filtrare pe server.
  document.getElementById("btn-filtrare-server").addEventListener("click", async function () {
    if (!valideazaInputuri(true)) return;
    const params = new URLSearchParams({ nume: inpNume.value.trim(), scor: inpScor.value, categorie: valoriSelectate(".filtru-categorie")[0] || "", cheie1: document.getElementById("cheie-sortare-1").value, cheie2: document.getElementById("cheie-sortare-2").value, sens: "asc" });
    const raspuns = await fetch(`/api/produse-filtrate?${params}`);
    if (!raspuns.ok) return afiseazaCalcul("Filtrarea pe server nu a putut fi executată.");
    const { ids } = await raspuns.json(); const ordine = new Map(ids.map((id,index) => [String(id),index]));
    produse.forEach((produs) => { produs.dataset.corespunde = String(ordine.has(produs.dataset.produsId)); produs.dataset.ascunsTemporar = "false"; });
    [...produse].sort((a,b) => (ordine.get(a.dataset.produsId) ?? 9999) - (ordine.get(b.dataset.produsId) ?? 9999)).forEach((produs) => lista.append(produs));
    paginaCurenta = 1; actualizeazaPaginare(); numarProduse.textContent = `${ids.length} ${ids.length === 1 ? "produs" : "produse"}`;
    afiseazaCalcul(`Serverul PostgreSQL a returnat ${ids.length} produse.`);
  });
  document.getElementById("btn-sortare-crescator").addEventListener("click", () => sorteazaProduse(1));
  document.getElementById("btn-sortare-descrescator").addEventListener("click", () => sorteazaProduse(-1));
  document.getElementById("btn-calcul").addEventListener("click", calculeazaPreturi);
  document.getElementById("btn-resetare").addEventListener("click", reseteazaFiltre);

  salveazaFiltre.addEventListener("change", function () {
    if (salveazaFiltre.checked) salveazaStareFiltre();
    else localStorage.removeItem(cheieFiltrePersistente);
  });

  // Etapa 6 – Bonus 4: Filtrare imediată.
  document.querySelectorAll("#zona-filtre input, #zona-filtre textarea, #zona-filtre select").forEach(function (input) {
    const eveniment = input.matches('input[type="text"], input[type="range"], textarea') ? "input" : "change";
    input.addEventListener(eveniment, () => aplicaFiltrare(false));
  });
  restaureazaStareFiltre();
  aplicaFiltrare();
  afiseazaComparatie();
  animeazaCarduriBootstrap();
});

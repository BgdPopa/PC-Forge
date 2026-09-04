// Etapa 7 – Cerință: Banner animat și cookie-uri.
(function () {
  "use strict";

  /** Returneaza valoarea decodificata a cookie-ului cerut. */
  function citesteCookie(nume) {
    const prefix = `${encodeURIComponent(nume)}=`;
    const pereche = document.cookie.split("; ").find((element) => element.startsWith(prefix));
    return pereche ? decodeURIComponent(pereche.slice(prefix.length)) : null;
  }

  /** Salveaza un cookie pentru numarul indicat de zile. */
  function seteazaCookie(nume, valoare, zile = 7) {
    const expirare = new Date(Date.now() + zile * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${encodeURIComponent(nume)}=${encodeURIComponent(valoare)}; expires=${expirare}; path=/; SameSite=Lax`;
  }

  /* Etapa 7 – Cerință: Funcția deleteCookie. */
  function deleteCookie(nume) {
    document.cookie = `${encodeURIComponent(nume)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  }

  /* Etapa 7 – Cerință: Ștergerea tuturor cookie-urilor. */
  function deleteAllCookies() {
    document.cookie.split(";").forEach(function (pereche) {
      const nume = decodeURIComponent(pereche.split("=")[0].trim());
      if (nume) deleteCookie(nume);
    });
  }

  // Functiile raman accesibile din consola pentru demonstratia ceruta.
  window.deleteCookie = deleteCookie;
  window.deleteAllCookies = deleteAllCookies;

  document.addEventListener("DOMContentLoaded", function () {
    const banner = document.getElementById("banner");
    const butonOk = document.getElementById("ok_cookies");
    const infoActivitate = document.getElementById("info-cookie-activitate");
    const cookieAcceptat = citesteCookie("pc_forge_cookies_acceptate");

    if (banner && !cookieAcceptat) {
      banner.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(() => banner.classList.add("banner--vizibil"));
      });
    }

    if (butonOk) {
      butonOk.addEventListener("click", function () {
        seteazaCookie("pc_forge_cookies_acceptate", "da", 7);
        banner.classList.add("banner--inchis");
        window.setTimeout(() => { banner.hidden = true; }, 450);
      });
    }

    // Etapa 7 – Cerință: Memorarea ultimei pagini.
    const paginaAnterioara = citesteCookie("pc_forge_ultima_pagina");
    const paginaCurenta = `${document.title} (${window.location.pathname})`;
    seteazaCookie("pc_forge_ultima_pagina", paginaCurenta, 7);
    if (infoActivitate && paginaAnterioara && paginaAnterioara !== paginaCurenta) {
      infoActivitate.textContent = `Ultima pagină vizitată: ${paginaAnterioara}`;
      infoActivitate.hidden = false;
      window.setTimeout(() => { infoActivitate.hidden = true; }, 8000);
    }

    // Pe pagina proprie a produsului pastram si ultimul produs consultat.
    if (document.body.dataset.produsNume) {
      seteazaCookie("pc_forge_ultimul_produs", document.body.dataset.produsNume, 7);
    }
  });
})();

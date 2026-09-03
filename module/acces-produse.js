// Etapa 6 - cerinta individuala, punctul 3:
// accesul centralizat la tabela produse prin utilizatorul cu drepturi limitate.
// Etapa 7 - clasa AccesBD este folosita efectiv de modulul produselor,
// astfel intreaga aplicatie reutilizeaza acelasi pool PostgreSQL (singleton).
const AccesBD = require("./acces-bd");
const pool = AccesBD.getInstanta().getClient();
const { obtineProduseNoiOrm } = require("./acces-orm");

/** @returns {Promise<{baza:string, utilizator:string}>} Identitatea conexiunii active. */
async function testeazaConexiune() {
  const rezultat = await pool.query("SELECT current_database() AS baza, current_user AS utilizator");
  return rezultat.rows[0];
}

// Etapa 6 - cerinta individuala, punctul 4:
// valorile meniului sunt citite din ENUM, nu sunt scrise manual in EJS.
/** @returns {Promise<string[]>} Valorile ENUM categorie_produs in ordinea bazei. */
async function obtineCategorii() {
  const rezultat = await pool.query(`
    SELECT enumlabel AS valoare
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'categorie_produs'
    ORDER BY enumsortorder
  `);
  return rezultat.rows.map((rand) => rand.valoare);
}

// Etapa 6 - cerinta individuala, punctul 4:
// filtrarea pe categorie se face la nivel de server cu query parametrizat.
/**
 * @param {string} [categorie] Categoria optionala validata de server.
 * @returns {Promise<object[]>} Produsele cerute.
 */
async function obtineProduse(categorie) {
  const parametri = [];
  let conditie = "";

  if (categorie) {
    parametri.push(categorie);
    conditie = "WHERE categorie = $1::categorie_produs";
  }

  const rezultat = await pool.query(
    `SELECT id, nume, descriere, imagine, categorie::text, subcategorie,
            pret::float8 AS pret, scor_performanta,
            to_char(data_adaugare, 'YYYY-MM-DD') AS data_adaugare,
            culoare::text, conectivitate, in_stoc
     FROM produse
     ${conditie}
     ORDER BY id`,
    parametri,
  );

  return rezultat.rows;
}

// Etapa 6 - cerinta individuala, punctul 2: pagina unui produs unic.
/**
 * @param {number} id Identificatorul numeric al produsului.
 * @returns {Promise<object|null>} Produsul gasit sau null.
 */
async function obtineProdusDupaId(id) {
  const rezultat = await pool.query(
    `SELECT id, nume, descriere, imagine, categorie::text, subcategorie,
            pret::float8 AS pret, scor_performanta,
            to_char(data_adaugare, 'YYYY-MM-DD') AS data_adaugare,
            culoare::text, conectivitate, in_stoc
     FROM produse
     WHERE id = $1`,
    [id],
  );
  return rezultat.rows[0] || null;
}

// Etapa 6 - Bonus 16: produse similare din aceeasi categorie, cu prioritate
// pentru aceeasi subcategorie si fara produsul curent.
/** @param {object} produs Produsul de referinta. @param {number} [limita=4] Limita. @returns {Promise<object[]>} Produse similare. */
async function obtineProduseSimilare(produs, limita = 4) {
  const rezultat = await pool.query(
    `SELECT id, nume, descriere, imagine, categorie::text, subcategorie,
            pret::float8 AS pret, scor_performanta
     FROM produse
     WHERE id <> $1 AND categorie = $2::categorie_produs
     ORDER BY (subcategorie = $3) DESC, ABS(pret - $4), id
     LIMIT $5`,
    [produs.id, produs.categorie, produs.subcategorie, produs.pret, limita],
  );
  return rezultat.rows;
}

// Etapa 6 - Bonus 20: citirea stricta a celor doua produse cerute de comparatie.
/** @param {number[]} ids Identificatori validati. @returns {Promise<object[]>} Produsele comparate. */
async function obtineProduseDupaIduri(ids) {
  const rezultat = await pool.query(
    `SELECT id, nume, descriere, imagine, categorie::text, subcategorie,
            pret::float8 AS pret, scor_performanta, culoare::text,
            conectivitate, in_stoc
     FROM produse WHERE id = ANY($1::int[]) ORDER BY array_position($1::int[], id)`,
    [ids],
  );
  return rezultat.rows;
}

// Etapa 6 - Bonus 17: seturile, produsele lor si pretul redus sunt calculate in SQL.
/** @param {number|null} [idProdus=null] Filtrare optionala dupa produs. @returns {Promise<object[]>} Seturi grupate. */
async function obtineSeturi(idProdus = null) {
  const rezultat = await pool.query(
    `SELECT s.id,s.nume_set,s.descriere_set,
      json_agg(json_build_object('id',p.id,'nume',p.nume,'imagine',p.imagine,'pret',p.pret::float8) ORDER BY p.id) AS produse,
      SUM(p.pret)::float8 AS pret_brut, COUNT(p.id)::int AS numar_produse
     FROM seturi s JOIN asociere_set a ON a.id_set=s.id JOIN produse p ON p.id=a.id_produs
     ${idProdus ? "WHERE s.id IN (SELECT id_set FROM asociere_set WHERE id_produs=$1)" : ""}
     GROUP BY s.id ORDER BY s.id`,
    idProdus ? [idProdus] : [],
  );
  return rezultat.rows.map((set) => ({ ...set, reducere: Math.min(5, set.numar_produse) * 5, pret_redus: set.pret_brut * (1 - Math.min(5, set.numar_produse) * 0.05) }));
}

// Etapa 8 - Bonus 13: numarul total si marcajul utilizatorului curent.
/** @param {number[]} ids Produsele cerute. @param {number|null} idUtilizator Utilizatorul logat. @returns {Promise<Map<number,object>>} Date favorite. */
async function obtineDateFavorite(ids, idUtilizator = null) {
  if (!ids.length) return new Map();
  const rezultat = await pool.query(
    `SELECT p.id,COUNT(f.id)::int AS numar_favorite,
      COALESCE(BOOL_OR(f.id_utilizator=$2),false) AS este_favorit
     FROM produse p LEFT JOIN favorite f ON f.id_produs=p.id
     WHERE p.id=ANY($1::int[]) GROUP BY p.id`,
    [ids, idUtilizator || -1],
  );
  return new Map(rezultat.rows.map((rand) => [rand.id, rand]));
}

// Etapa 6 - Bonus 10a/10b: filtrare si sortare pe server, apelate prin fetch.
/** @param {object} filtre Filtre validate. @returns {Promise<object[]>} ID-urile in ordinea serverului. */
async function obtineProduseFiltrate(filtre = {}) {
  const conditii = []; const valori = [];
  if (filtre.nume) { valori.push(`%${filtre.nume}%`); conditii.push(`lower(nume) LIKE lower($${valori.length})`); }
  if (Number.isFinite(Number(filtre.scor))) { valori.push(Number(filtre.scor)); conditii.push(`scor_performanta >= $${valori.length}`); }
  if (filtre.categorie) { valori.push(filtre.categorie); conditii.push(`categorie = $${valori.length}::categorie_produs`); }
  const cheiPermise = { nume: "nume", pret: "pret", scor: "scor_performanta", subcategorie: "subcategorie", raport: "scor_performanta/pret" };
  const cheie1 = cheiPermise[filtre.cheie1] || "pret"; const cheie2 = cheiPermise[filtre.cheie2] || "nume";
  const sens = filtre.sens === "desc" ? "DESC" : "ASC";
  const rezultat = await pool.query(`SELECT id FROM produse ${conditii.length ? "WHERE " + conditii.join(" AND ") : ""} ORDER BY ${cheie1} ${sens},${cheie2} ${sens},id`, valori);
  return rezultat.rows;
}

// Etapa 6 - Bonus 18: produsele noi pentru sectiunea de pe prima pagina
// sunt selectate din baza de date dupa data, nu scrise manual in EJS.
/**
 * @param {number} [limita=4] Numarul maxim de produse returnate.
 * @returns {Promise<object[]>} Cele mai recente produse.
 */
async function obtineProduseNoi(limita = 4) {
  // Etapa 7 - Bonus 2: aceasta selectie foloseste modelul Sequelize, nu SQL scris manual.
  return obtineProduseNoiOrm(limita);
}

module.exports = {
  testeazaConexiune,
  obtineCategorii,
  obtineProduse,
  obtineProdusDupaId,
  obtineProduseSimilare,
  obtineProduseDupaIduri,
  obtineSeturi,
  obtineDateFavorite,
  obtineProduseFiltrate,
  obtineProduseNoi,
};

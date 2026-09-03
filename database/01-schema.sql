-- Etapa 6 - cerinta individuala, punctul 3: baza de date si tabelul produse.
-- Categoriile mari sunt ENUM si au maximum cinci valori, conform cerintei.
CREATE TYPE categorie_produs AS ENUM (
  'componente',
  'stocare',
  'racire',
  'periferice',
  'monitoare'
);

-- Etapa 6 - cerinta individuala, punctul 3j:
-- caracteristica de tip sir cu o singura valoare dintr-un set.
CREATE TYPE culoare_produs AS ENUM (
  'negru',
  'alb',
  'gri',
  'argintiu',
  'rosu'
);

CREATE TABLE produse (
  id SERIAL PRIMARY KEY,
  nume VARCHAR(120) NOT NULL UNIQUE,
  descriere TEXT NOT NULL,
  imagine VARCHAR(255) NOT NULL,
  categorie categorie_produs NOT NULL,
  subcategorie VARCHAR(60) NOT NULL,
  pret NUMERIC(10, 2) NOT NULL CHECK (pret > 0),
  scor_performanta SMALLINT NOT NULL CHECK (scor_performanta BETWEEN 1 AND 100),
  data_adaugare DATE NOT NULL DEFAULT CURRENT_DATE,
  culoare culoare_produs NOT NULL,
  conectivitate TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  in_stoc BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_produse_categorie ON produse(categorie);
CREATE INDEX idx_produse_subcategorie ON produse(subcategorie);
CREATE INDEX idx_produse_pret ON produse(pret);

COMMENT ON TABLE produse IS 'Etapa 6 - produsele afisate si filtrate in aplicatia PC Forge web';
COMMENT ON COLUMN produse.scor_performanta IS 'A doua caracteristica numerica, folosita de filtrul range; nu este pretul';
COMMENT ON COLUMN produse.conectivitate IS 'Caracteristica text cu mai multe valori';

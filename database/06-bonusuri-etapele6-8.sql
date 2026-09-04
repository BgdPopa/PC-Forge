-- Etapele 6 și 8 – Cerință: Definirea utilizatori.
ALTER TABLE utilizatori
  ADD COLUMN IF NOT EXISTS notificare_confirmare_trimisa TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS token_resetare VARCHAR(100),
  ADD COLUMN IF NOT EXISTS expirare_token_resetare TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS incercari_login SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prima_incercare_esuat TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocat_login_pana TIMESTAMPTZ,
  -- Etapa 8 – Bonus 9: Autentificare persistentă.
  ADD COLUMN IF NOT EXISTS ramai_conectat BOOLEAN NOT NULL DEFAULT FALSE;
-- Etapa 8 – Bonus 13e/f: Favorite și notificări de stoc.
ALTER TABLE produse ADD COLUMN IF NOT EXISTS stoc INTEGER NOT NULL DEFAULT 10 CHECK (stoc >= 0);
UPDATE produse SET stoc=0 WHERE in_stoc=FALSE AND stoc<>0;
ALTER TABLE utilizatori ADD COLUMN IF NOT EXISTS ultima_promotie TIMESTAMPTZ;
ALTER TYPE rol_utilizator ADD VALUE IF NOT EXISTS 'manager_produse';

CREATE TABLE IF NOT EXISTS favorite (
  id SERIAL PRIMARY KEY,
  id_produs INTEGER NOT NULL REFERENCES produse(id) ON DELETE CASCADE,
  id_utilizator INTEGER NOT NULL REFERENCES utilizatori(id) ON DELETE CASCADE,
  data_favorit TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_produs, id_utilizator)
);

CREATE TABLE IF NOT EXISTS seturi (
  id SERIAL PRIMARY KEY,
  nume_set VARCHAR(120) NOT NULL UNIQUE,
  descriere_set TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS asociere_set (
  id SERIAL PRIMARY KEY,
  id_set INTEGER NOT NULL REFERENCES seturi(id) ON DELETE CASCADE,
  id_produs INTEGER NOT NULL REFERENCES produse(id) ON DELETE CASCADE,
  UNIQUE(id_set, id_produs)
);

INSERT INTO seturi(nume_set, descriere_set) VALUES
 ('Forge Starter', 'Configurație echilibrată pentru primul calculator.'),
 ('Forge Vision', 'Pachet pentru jocuri și conținut vizual.'),
 ('Forge Studio', 'Set pentru lucru creativ și multitasking.'),
 ('Forge Compact', 'Componente pentru un birou aerisit.'),
 ('Forge Command', 'Periferice potrivite pentru control precis.')
ON CONFLICT (nume_set) DO NOTHING;

INSERT INTO asociere_set(id_set,id_produs)
SELECT s.id,p.id FROM seturi s JOIN produse p ON
 (s.nume_set='Forge Starter' AND p.id IN (1,6,9)) OR
 (s.nume_set='Forge Vision' AND p.id IN (4,7,20)) OR
 (s.nume_set='Forge Studio' AND p.id IN (5,7,10)) OR
 (s.nume_set='Forge Compact' AND p.id IN (2,12,16)) OR
 (s.nume_set='Forge Command' AND p.id IN (15,17,19))
ON CONFLICT (id_set,id_produs) DO NOTHING;

CREATE TABLE IF NOT EXISTS roluri (id SERIAL PRIMARY KEY, nume VARCHAR(40) UNIQUE NOT NULL, descriere TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS drepturi (id SERIAL PRIMARY KEY, nume VARCHAR(60) UNIQUE NOT NULL, descriere TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS roluri_drepturi (id SERIAL PRIMARY KEY, id_rol INTEGER REFERENCES roluri(id) ON DELETE CASCADE, id_drept INTEGER REFERENCES drepturi(id) ON DELETE CASCADE, UNIQUE(id_rol,id_drept));
CREATE TABLE IF NOT EXISTS utilizatori_roluri (id SERIAL PRIMARY KEY, id_utilizator INTEGER REFERENCES utilizatori(id) ON DELETE CASCADE, id_rol INTEGER REFERENCES roluri(id) ON DELETE CASCADE, data_inceput DATE, data_expirare DATE, UNIQUE(id_utilizator,id_rol,data_inceput));

INSERT INTO roluri(nume,descriere) VALUES ('admin','Acces complet'),('manager_produse','Administrarea produselor'),('moderator','Administrarea utilizatorilor'),('comun','Utilizator client') ON CONFLICT DO NOTHING;
INSERT INTO drepturi(nume,descriere) VALUES ('vizualizare_utilizatori','Vizualizează utilizatori'),('modificare_utilizatori','Modifică utilizatori'),('stergere_utilizatori','Șterge utilizatori'),('adaugare_produse','Adaugă produse'),('modificare_produse','Modifică produse'),('stergere_produse','Șterge produse'),('cumparare','Poate cumpăra'),('alocare_roluri','Poate aloca roluri') ON CONFLICT DO NOTHING;
INSERT INTO roluri_drepturi(id_rol,id_drept)
SELECT r.id,d.id FROM roluri r CROSS JOIN drepturi d WHERE r.nume='admin' OR (r.nume='manager_produse' AND d.nume LIKE '%produse') OR (r.nume='moderator' AND d.nume LIKE '%utilizatori') OR (r.nume='comun' AND d.nume='cumparare') ON CONFLICT DO NOTHING;

-- Etapa 8 – Bonus 11: Roluri cu perioadă de valabilitate.
INSERT INTO utilizatori_roluri(id_utilizator,id_rol,data_inceput,data_expirare)
SELECT u.id,r.id,NULL,NULL
FROM utilizatori u JOIN roluri r ON r.nume=u.rol::text
WHERE NOT EXISTS (
  SELECT 1 FROM utilizatori_roluri ur
  WHERE ur.id_utilizator=u.id AND ur.id_rol=r.id
);

GRANT SELECT,INSERT,UPDATE,DELETE ON favorite,seturi,asociere_set,roluri,drepturi,roluri_drepturi,utilizatori_roluri TO site_componente_app;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO site_componente_app;

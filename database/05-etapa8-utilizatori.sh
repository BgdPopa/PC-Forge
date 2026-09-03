#!/bin/sh
set -eu

# Etapa 8 - extinderea sistemului de utilizatori pentru inregistrare si autentificare.
psql --set ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=app_user="$APP_DB_USER" <<'EOSQL'
ALTER TABLE utilizatori
  ADD COLUMN IF NOT EXISTS data_nasterii DATE,
  ADD COLUMN IF NOT EXISTS salt VARCHAR(64),
  ADD COLUMN IF NOT EXISTS confirmat_mail BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS token_confirmare_1 VARCHAR(80),
  ADD COLUMN IF NOT EXISTS token_confirmare_2 VARCHAR(80),
  ADD COLUMN IF NOT EXISTS blocat BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS imagine VARCHAR(255) NOT NULL DEFAULT '/resurse/imagini/utilizatori/avatar-implicit.svg',
  ADD COLUMN IF NOT EXISTS tema VARCHAR(10) NOT NULL DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS ultima_logare TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ultima_activitate TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ip_ultima_accesare VARCHAR(80);

ALTER TABLE utilizatori ALTER COLUMN culoare_chat SET DEFAULT '#000000';

CREATE INDEX IF NOT EXISTS idx_utilizatori_ultima_activitate
  ON utilizatori(ultima_activitate);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE utilizatori TO :"app_user";
GRANT USAGE, SELECT ON SEQUENCE utilizatori_id_seq TO :"app_user";
EOSQL

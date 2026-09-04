#!/bin/sh
set -eu

# Etapa 7 – Cerință: Sistemul de utilizatori.
psql --set ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=app_user="$APP_DB_USER" <<'EOSQL'
DO $$ BEGIN
  CREATE TYPE rol_utilizator AS ENUM ('comun', 'client', 'moderator', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS utilizatori (
  id SERIAL PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  nume VARCHAR(60) NOT NULL,
  prenume VARCHAR(60) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  parola VARCHAR(255) NOT NULL,
  culoare_chat VARCHAR(7) NOT NULL DEFAULT '#e1012f',
  rol rol_utilizator NOT NULL DEFAULT 'comun',
  data_inregistrare TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE utilizatori TO :"app_user";
GRANT USAGE, SELECT ON SEQUENCE utilizatori_id_seq TO :"app_user";
EOSQL

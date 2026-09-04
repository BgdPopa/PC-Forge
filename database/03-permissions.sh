#!/bin/sh
set -eu

# Etapa 6 – Cerința 3: Definirea ROLE.
psql --set ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=app_user="$APP_DB_USER" \
  --set=app_password="$APP_DB_PASSWORD" <<'EOSQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'app_user') \gexec

GRANT CONNECT ON DATABASE site_componente_db TO :"app_user";
GRANT USAGE ON SCHEMA public TO :"app_user";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE produse TO :"app_user";
GRANT USAGE, SELECT ON SEQUENCE produse_id_seq TO :"app_user";
EOSQL

#!/bin/sh
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE ROLE urusin_migrator LOGIN PASSWORD '${URUSIN_MIGRATOR_PASSWORD}';
ALTER ROLE urusin_migrator CREATEDB;
CREATE ROLE urusin_app LOGIN PASSWORD '${URUSIN_APP_PASSWORD}';

GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO urusin_migrator, urusin_app;
GRANT CREATE ON DATABASE "${POSTGRES_DB}" TO urusin_migrator;

GRANT USAGE, CREATE ON SCHEMA public TO urusin_migrator;
GRANT USAGE ON SCHEMA public TO urusin_app;

ALTER DEFAULT PRIVILEGES FOR ROLE urusin_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO urusin_app;
ALTER DEFAULT PRIVILEGES FOR ROLE urusin_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO urusin_app;

ALTER ROLE urusin_app SET statement_timeout = '5s';
ALTER ROLE urusin_app SET idle_in_transaction_session_timeout = '10s';
SQL

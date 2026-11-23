#!/bin/sh
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE DATABASE urusin_test OWNER urusin_migrator;
GRANT CONNECT ON DATABASE urusin_test TO urusin_app;
SQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "urusin_test" <<SQL
CREATE EXTENSION IF NOT EXISTS pg_trgm;
GRANT USAGE, CREATE ON SCHEMA public TO urusin_migrator;
GRANT USAGE ON SCHEMA public TO urusin_app;
ALTER DEFAULT PRIVILEGES FOR ROLE urusin_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO urusin_app;
ALTER DEFAULT PRIVILEGES FOR ROLE urusin_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO urusin_app;
-- Hanya database test: reset antar-test membutuhkan TRUNCATE.
ALTER DEFAULT PRIVILEGES FOR ROLE urusin_migrator IN SCHEMA public
  GRANT TRUNCATE ON TABLES TO urusin_app;
GRANT TRUNCATE ON ALL TABLES IN SCHEMA public TO urusin_app;
SQL

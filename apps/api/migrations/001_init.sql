-- 001: extensions
-- (CREATE DATABASE / \c removed — postgres container creates the DB
-- via POSTGRES_DB env, and the pg Node driver can't run psql meta
-- commands like \c.)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

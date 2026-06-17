-- Script de inicialización de base de datos Cruz Azul ERP
-- Ejecutar contra AWS RDS PostgreSQL

-- Crear base de datos (ejecutar como superusuario)
CREATE DATABASE cruzazul_erp
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'es_CL.UTF-8'
    LC_CTYPE = 'es_CL.UTF-8'
    TEMPLATE = template0;

-- Conectarse a la base de datos
\c cruzazul_erp;

-- Crear esquema principal
CREATE SCHEMA IF NOT EXISTS cruzazul AUTHORIZATION postgres;
SET search_path TO cruzazul, public;

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ejecutar schema principal
\i ../schema.sql

-- Configuración de seguridad
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO admin_cruzazul;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO admin_cruzazul;

-- Configuración de backup automático
CREATE EVENT TRIGGER trg_backup_notify
ON ddl_command_end
EXECUTE FUNCTION notify_backup_required();

-- Parámetros de seguridad RDS
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET ssl = 'on';
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

SELECT 'Base de datos CruzAzul ERP inicializada correctamente' AS mensaje;

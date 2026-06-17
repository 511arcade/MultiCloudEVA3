-- Esquema de Base de Datos - Cruz Azul ERP
-- Motor: PostgreSQL 16 (AWS RDS)
-- Proposito: Portal de Autenticación Multifactor

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'auditor')),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    backup_codes TEXT,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices para usuarios
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Tabla de logs de autenticación
CREATE TABLE IF NOT EXISTS auth_logs (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    details TEXT,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices para auth_logs
CREATE INDEX idx_auth_logs_username ON auth_logs(username);
CREATE INDEX idx_auth_logs_attempted_at ON auth_logs(attempted_at);
CREATE INDEX idx_auth_logs_success ON auth_logs(success);

-- Tabla de sesiones activas
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    mfa_verified BOOLEAN DEFAULT FALSE,
    ssh_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Tabla de políticas de acceso condicional
CREATE TABLE IF NOT EXISTS access_policies (
    id SERIAL PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    conditions JSONB,
    actions JSONB,
    priority INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de backup_history para tracking de backups a S3
CREATE TABLE IF NOT EXISTS backup_history (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    s3_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

CREATE INDEX idx_backup_history_status ON backup_history(status);
CREATE INDEX idx_backup_history_started ON backup_history(started_at);

-- Tabla de configuración MFA por usuario
CREATE TABLE IF NOT EXISTS user_mfa_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    device_name VARCHAR(100),
    device_type VARCHAR(50) DEFAULT 'totp',
    secret_key VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_mfa_devices_user ON user_mfa_devices(user_id);

-- Tabla de códigos de respaldo
CREATE TABLE IF NOT EXISTS backup_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    code_hash VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backup_codes_user ON backup_codes(user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar usuarios por defecto (solo para desarrollo)
-- En producción, estos deben ser creados mediante el procedimiento de onboarding
INSERT INTO users (username, email, password_hash, role) VALUES
    ('admin.cruzazul', 'admin@cruzazul.cl', '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gzq5y6z7w8x9y0a1b2c3d4e5f', 'admin'),
    ('operador1', 'operador1@cruzazul.cl', '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gzq5y6z7w8x9y0a1b2c3d4e5f', 'user'),
    ('auditor1', 'auditor1@cruzazul.cl', '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gzq5y6z7w8x9y0a1b2c3d4e5f', 'auditor')
ON CONFLICT (username) DO NOTHING;

-- Comentarios de tabla para documentación
COMMENT ON TABLE users IS 'Usuarios del sistema ERP Cruz Azul';
COMMENT ON TABLE auth_logs IS 'Registro de intentos de autenticación';
COMMENT ON TABLE audit_logs IS 'Auditoría de acciones administrativas';
COMMENT ON TABLE access_policies IS 'Políticas de acceso condicional';
COMMENT ON TABLE backup_history IS 'Historial de backups enviados a S3';

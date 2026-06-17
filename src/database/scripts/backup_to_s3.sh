#!/bin/bash
# Script de backup automático para base de datos RDS PostgreSQL
# Almacenamiento: AWS S3 Bucket
# Frecuencia: Cada 24 horas (ejecutar via cron o EventBridge)
# Proposito: Cumplimiento punto 5 - Copias de seguridad cada 24h a S3

set -e

# ============================================
# Configuración
# ============================================
DB_HOST="${DB_HOST:-cruzazul-rds.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-cruzazul_erp}"
DB_USER="${DB_USER:-admin_cruzazul}"
DB_PASSWORD="${DB_PASSWORD:-}"
S3_BUCKET="${S3_BUCKET:-cruzazul-backups-prod}"
S3_PREFIX="${S3_PREFIX:-database/backups}"
BACKUP_DIR="${BACKUP_DIR:-/tmp/cruzazul-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="cruzazul_erp_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# ============================================
# Funciones
# ============================================
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

cleanup() {
    log "Limpiando archivos temporales..."
    rm -f "${BACKUP_PATH}"
    rm -f "${BACKUP_PATH}.sha256"
}

# ============================================
# Validaciones
# ============================================
if [ -z "${DB_PASSWORD}" ]; then
    log "ERROR: DB_PASSWORD no está configurada"
    exit 1
fi

if [ -z "${AWS_ACCESS_KEY_ID}" ] || [ -z "${AWS_SECRET_ACCESS_KEY}" ]; then
    log "ERROR: Credenciales AWS no configuradas"
    exit 1
fi

# ============================================
# Crear directorio de backup
# ============================================
mkdir -p "${BACKUP_DIR}"

log "=========================================="
log "Iniciando backup de base de datos"
log "Base de datos: ${DB_NAME}@${DB_HOST}"
log "Bucket S3: ${S3_BUCKET}/${S3_PREFIX}"
log "=========================================="

# ============================================
# Ejecutar pg_dump con compresión
# ============================================
log "Ejecutando pg_dump..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --format=custom \
    --verbose \
    --no-owner \
    --no-acl \
    --compress=9 \
    --file="${BACKUP_PATH}" 2>&1 | tee -a "${LOG_FILE}"

if [ $? -ne 0 ]; then
    log "ERROR: pg_dump falló"
    cleanup
    exit 1
fi

# ============================================
# Verificar integridad del backup
# ============================================
log "Verificando integridad del backup..."
pg_restore -l "${BACKUP_PATH}" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    log "ERROR: El archivo backup está corrupto"
    cleanup
    exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
log "Backup creado exitosamente: ${BACKUP_PATH} (${BACKUP_SIZE})"

# ============================================
# Generar checksum SHA256
# ============================================
log "Generando checksum SHA256..."
sha256sum "${BACKUP_PATH}" > "${BACKUP_PATH}.sha256"

# ============================================
# Subir a S3
# ============================================
log "Subiendo backup a S3..."
aws s3 cp "${BACKUP_PATH}" "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}" \
    --storage-class STANDARD_IA \
    --metadata "database=${DB_NAME},timestamp=${TIMESTAMP},type=pg_dump-custom"

if [ $? -ne 0 ]; then
    log "ERROR: Falló la subida a S3"
    cleanup
    exit 1
fi

aws s3 cp "${BACKUP_PATH}.sha256" "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}.sha256" \
    --metadata "database=${DB_NAME},timestamp=${TIMESTAMP}"

log "Backup subido exitosamente a s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}"

# ============================================
# Limpiar backups locales
# ============================================
log "Limpiando archivos temporales..."
rm -f "${BACKUP_PATH}"
rm -f "${BACKUP_PATH}.sha256"

# ============================================
# Limpiar backups antiguos en S3
# ============================================
log "Limpiando backups antiguos en S3 (retención: ${RETENTION_DAYS} días)..."
CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | while read -r line; do
    FILE_DATE=$(echo "${line}" | awk '{print $1}')
    FILE_NAME=$(echo "${line}" | awk '{print $4}')
    if [[ "${FILE_DATE}" < "${CUTOFF_DATE}" ]] && [[ "${FILE_NAME}" == *.sql.gz ]]; then
        log "Eliminando backup antiguo: ${FILE_NAME}"
        aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${FILE_NAME}"
    fi
done

# ============================================
# Finalización
# ============================================
log "=========================================="
log "Backup completado exitosamente"
log "Tamaño: ${BACKUP_SIZE}"
log "Destino: s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}"
log "=========================================="

exit 0

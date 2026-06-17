# Cruz Azul ERP - Portal de Autenticación Multifactor

## Descripción del Proyecto

Sistema de autenticación multifactor (MFA) para la cadena de farmacias Cruz Azul, implementando:
- **2 factores** para usuarios del sitio web (contraseña + TOTP)
- **3 factores** para administradores (contraseña + TOTP + verificación SSH)
- Acceso condicional basado en políticas de seguridad
- Integración con AWS RDS (PostgreSQL) y S3 para backups
- Infraestructura como código con Terraform

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   CloudFront/CDN                     │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│           Application Load Balancer (ALB)           │
│              HTTPS (TLS 1.3) - Puerto 443           │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Nginx Reverse Proxy                     │
│         (Rate Limiting, WAF, SSL Termination)        │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│      Frontend - Node.js + Express (EC2 / Docker)    │
│  - Autenticación por contraseña (Paso 1)            │
│  - Verificación TOTP (Paso 2)                       │
│  - Verificación SSH Admin (Paso 3)                  │
│  - Acceso Condicional                               │
│  - Rate Limiting                                    │
└────────┬──────────────────────────┬─────────────────┘
         │                          │
         │                    ┌─────▼──────────────┐
         │                    │  Redis Cache       │
         │                    │ (Sesiones, MFA)    │
         │                    └────────────────────┘
         │
┌────────▼──────────────────────────────────────────┐
│    AWS RDS - PostgreSQL (PaaS)                    │
│    - Base de datos: cruzazul_erp                  │
│    - Backup automático cada 24h → S3              │
│    - SSL/TLS obligatorio                          │
└───────────────────────────────────────────────────┘
```

## Requisitos

- Node.js 20+
- Docker & Docker Compose
- AWS CLI configurado
- Terraform (opcional, para infraestructura)

## Instalación y Despliegue

### 1. Configurar variables de entorno

```bash
cp src/frontend/.env.example src/frontend/.env
# Editar .env con credenciales reales
```

### 2. Construir y ejecutar con Docker

```bash
docker-compose -f docker/docker-compose.yml build
docker-compose -f docker/docker-compose.yml up -d
```

### 3. Verificar el despliegue

```bash
docker-compose -f docker/docker-compose.yml ps
docker-compose -f docker/docker-compose.yml logs frontend
```

### 4. Acceder al portal

- Web: https://portal.cruzazul.cl
- Admin: https://admin.cruzazul.internal

## Seguridad

- **MFA 2 pasos**: Contraseña + TOTP (Google Authenticator, Authy)
- **MFA 3 pasos** (Admin): Contraseña + TOTP + Clave SSH
- **Rate Limiting**: 5 intentos de login cada 15 minutos
- **Security Groups**: Mínima exposición (solo puertos 80/443 desde internet)
- **RDS**: Acceso solo desde EC2 (puerto 5432 cerrado a internet)
- **Helmet.js**: Headers de seguridad HTTP
- **JWT**: Tokens con expiración de 15 minutos
- **Backups cifrados** a S3 con retención de 30 días

## AWS Resources

| Recurso | Tipo | Descripción |
|---------|------|-------------|
| EC2 | Compute | Frontend Node.js |
| RDS | PaaS | PostgreSQL 16 |
| S3 | Storage | Backups de BD |
| ALB | Network | Balanceador de carga |
| CloudFront | CDN | Distribución global |
| IAM | Security | Roles y políticas |

## Costos Estimados (Mensuales)

| Servicio | Costo USD |
|----------|-----------|
| EC2 (t3.medium) | $30.84 |
| RDS (db.t3.small) | $25.00 |
| S3 (100GB) | $2.30 |
| ALB | $22.00 |
| Data Transfer | $15.00 |
| **Total estimado** | **$95.14/mes** |

## Licencia

© 2024 Cruz Azul - Todos los derechos reservados

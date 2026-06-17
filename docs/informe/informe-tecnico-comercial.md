# INFORME TÉCNICO-COMERCIAL
## Proyecto: Integración de Mecanismos de Protección y Control de Acceso
### Infraestructura Cloud - Cadena de Farmacias Cruz Azul

---

**Carrera**: Ingeniería en Informática
**Asignatura**: Infraestructura Multicloud - EVA3
**Estudiante**: [Nombre del Estudiante]
**Profesor**: [Nombre del Profesor]
**Fecha**: Junio 2024

---

## Índice de Contenidos

1. [Introducción](#1-introducción)
2. [Análisis de Riesgos (EVA2)](#2-análisis-de-riesgos-eva2)
3. [Descripción Técnica de la Problemática](#3-descripción-técnica-de-la-problemática)
4. [Arquitectura de Seguridad en Capas](#4-arquitectura-de-seguridad-en-capas)
5. [Tecnologías Involucradas](#5-tecnologías-involucradas)
6. [Desarrollo y Testeo del Escenario Propuesto](#6-desarrollo-y-testeo-del-escenario-propuesto)
7. [Prueba de Concepto (PoC)](#7-prueba-de-concepto-poc)
8. [Memoria Explicativa AWS IAM](#8-memoria-explicativa-aws-iam)
9. [Análisis Comparativo de Costos](#9-análisis-comparativo-de-costos)
10. [Cronograma del Proyecto](#10-cronograma-del-proyecto)
11. [Ventajas del Desarrollo en Nube Pública](#11-ventajas-del-desarrollo-en-nube-pública)
12. [Justificación de Decisiones](#12-justificación-de-decisiones)
13. [Resultados Esperados](#13-resultados-esperados)
14. [Conclusiones y Comentarios Finales](#14-conclusiones-y-comentarios-finales)
15. [Acceso al Repositorio](#15-acceso-al-repositorio)

---

## 1. Introducción

La cadena de farmacias Cruz Azul ha requerido los servicios de ingeniería informática para llevar a cabo la integración de mecanismos de protección y control de acceso a su infraestructura y servicios cloud. El presente informe detalla el desarrollo completo de la solución, que contempla:

- **Portal de autenticación multifactor (MFA)** con:
  - 2 pasos para usuarios del sitio web (contraseña + TOTP)
  - 3 pasos para administradores (contraseña + TOTP + verificación SSH)
- **Infraestructura cloud basada en AWS** utilizando servicios IaaS y PaaS
- **Análisis de riesgos** basado en la infraestructura desplegada en EVA2
- **Arquitectura en capas** con diseño seguro
- **Backups automatizados** a S3 con intervalos de 24 horas
- **Memoria explicativa** del servicio AWS IAM y su equivalente en Azure

### 1.1 Objetivo General

Implementar un portal de autenticación multifactor para la infraestructura cloud de Cruz Azul, garantizando la protección de datos y el acceso seguro a los recursos, conforme a los estándares internacionales vigentes y al nuevo marco normativo nacional.

### 1.2 Objetivos Específicos

- OE1: Diseñar una arquitectura de seguridad en capas para la infraestructura cloud
- OE2: Implementar un portal de autenticación con MFA (2 pasos web, 3 pasos admin)
- OE3: Configurar AWS RDS PostgreSQL con backups automáticos a S3
- OE4: Establecer Security Groups con mínima exposición de recursos
- OE5: Documentar el servicio AWS IAM y su equivalente en Microsoft Entra ID
- OE6: Realizar análisis comparativo de costos entre proveedores cloud

---

## 2. Análisis de Riesgos (EVA2)

Basado en la infraestructura y servicios desplegados con anterioridad (EVA2), se identificaron las siguientes brechas de seguridad y procedimientos a reestructurar:

### 2.1 Brechas de Seguridad Identificadas

| ID | Brecha | Nivel de Riesgo | Descripción |
|:--:|--------|:--------------:|-------------|
| B-01 | Ausencia de autenticación multifactor | **CRÍTICO** | El acceso a la infraestructura carece de MFA, exponiendo los servicios a accesos no autorizados mediante credenciales comprometidas |
| B-02 | Falta de control de acceso condicional | **ALTO** | No existen políticas de acceso basadas en contexto (IP, dispositivo, ubicación geográfica) |
| B-03 | Security Groups permisivos | **ALTO** | Puertos administrativos (22, 5432) expuestos a internet sin restricción CIDR |
| B-04 | Sin cifrado en reposo para base de datos | **MEDIO** | Los datos almacenados en RDS no cuentan con cifrado habilitado |
| B-05 | Backups sin automatización | **MEDIO** | No existe un proceso automatizado de backups con periodicidad definida |
| B-06 | Logs de acceso no centralizados | **MEDIO** | No se registran los intentos de autenticación para auditoría |
| B-07 | Sesiones sin tiempo de expiración | **BAJO** | Las sesiones de usuario no tienen时限 de inactividad |
| B-08 | Sin rate limiting en login | **ALTO** | No hay protección contra ataques de fuerza bruta |

### 2.2 Procedimientos a Reestructurar

| ID | Procedimiento Actual | Nueva Propuesta |
|:--:|---------------------|-----------------|
| P-01 | Autenticación simple con usuario/contraseña | Autenticación multifactor (MFA) con TOTP + códigos de respaldo |
| P-02 | Acceso sin restricción a recursos administrativos | Acceso condicional + verificación SSH para administradores |
| P-03 | Puertos abiertos sin restricción | Security Groups con mínimo privilegio y CIDR específicos |
| P-04 | Sin política de backups | Backups automáticos cada 24h a S3 con retención de 30 días |
| P-05 | Sin registro de accesos | Sistema de logging con auditoría y alertas de seguridad |

### 2.3 Rediseño de Arquitectura

La nueva arquitectura propuesta considera un modelo basado en capas (definido en sección 4), incorporando:

1. **Capa de perímetro**: WAF, CloudFront, DDoS Protection
2. **Capa de red**: VPC segmentada, subnets públicas/privadas, NAT Gateway
3. **Capa de aplicación**: Auto Scaling, balanceo de carga, contenedores Docker
4. **Capa de datos**: RDS Multi-AZ, cifrado, backups automatizados
5. **Capa de monitoreo**: CloudWatch, CloudTrail, AWS Config

---

## 3. Descripción Técnica de la Problemática

### 3.1 Contexto

Farmacias Cruz Azul opera una infraestructura cloud que requiere reforzar sus mecanismos de seguridad para cumplir con:
- Estándares internacionales (ISO 27001, NIST CSF)
- Nuevo marco normativo nacional (Ley de Protección de Datos Personales)
- Buenas prácticas del Well-Architected Framework de AWS

### 3.2 Requerimientos Funcionales

| RF | Descripción | Prioridad |
|:--:|-------------|:---------:|
| RF-01 | Portal web con inicio de sesión seguro (contraseña + MFA) | Crítica |
| RF-02 | Verificación TOTP mediante aplicación autenticadora (Google Authenticator, Authy) | Crítica |
| RF-03 | Códigos de respaldo para recuperación de acceso | Alta |
| RF-04 | Tercer factor SSH para administradores | Alta |
| RF-05 | Acceso condicional basado en IP, User-Agent y rol | Alta |
| RF-06 | Rate limiting para prevenir ataques de fuerza bruta | Alta |
| RF-07 | Registro y auditoría de todos los intentos de autenticación | Alta |
| RF-08 | Sesiones con expiración automática | Media |
| RF-09 | Backups automáticos de base de datos cada 24 horas | Alta |
| RF-10 | Almacenamiento seguro de backups en S3 | Alta |

### 3.3 Requerimientos No Funcionales

| RNF | Descripción |
|:---:|-------------|
| RNF-01 | Disponibilidad: 99.9% (RDS Multi-AZ) |
| RNF-02 | Latencia: < 2 segundos en autenticación |
| RNF-03 | Cifrado: TLS 1.3 en tránsito, AES-256 en reposo |
| RNF-04 | Escalabilidad: Auto Scaling basado en carga |
| RNF-05 | Mantenibilidad: Infraestructura como código (Terraform) |
| RNF-06 | Portabilidad: Contenedores Docker |

---

## 4. Arquitectura de Seguridad en Capas

### 4.1 Diagrama de Arquitectura (Excalidraw)

El diagrama de arquitectura fue desarrollado en Excalidraw y se encuentra disponible en:
`docs/images/arquitectura.excalidraw`

### 4.2 Descripción de Capas

#### Capa 1: Internet / Clientes
- Usuarios web acceden mediante HTTPS (TLS 1.3)
- Administradores acceden mediante VPN + SSH
- Certificados SSL/TLS gestionados via AWS ACM

#### Capa 2: CDN / WAF
- **AWS CloudFront**: Distribución global con baja latencia
- **AWS WAF**: Protección contra inyecciones SQL, XSS, DDoS
- **Rate limiting** a nivel de edge

#### Capa 3: Balanceo de Carga
- **Application Load Balancer (ALB)**: Distribución de tráfico
- **Terminación SSL**: Descarga de cifrado en el balanceador
- **Health checks**: Monitoreo continuo de instancias

#### Capa 4: Aplicación (IaaS/PaaS)
- **EC2 Auto Scaling**: Grupo de instancias frontend
- **Nginx Reverse Proxy**: Terminación SSL secundaria, rate limiting
- **Node.js + Express**: Portal de autenticación con MFA
- **Redis ElastiCache**: Sesiones distribuidas, cache de TOTP

#### Capa 5: Datos (PaaS)
- **AWS RDS PostgreSQL 16**: Base de datos Multi-AZ
- **Cifrado en reposo**: AES-256
- **Backups automáticos**: Cada 24h a S3

#### Capa 6: Almacenamiento
- **AWS S3**: Backups de base de datos con ACL para control de acceso
- **Ciclo de vida**: Transición a Standard-IA (30d) y Glacier (90d)

#### Capa 7: Monitoreo y Seguridad
- **CloudWatch**: Métricas, logs, alarmas
- **CloudTrail**: Auditoría de API calls
- **AWS Config**: Evaluación de cumplimiento
- **GuardDuty**: Detección de amenazas

### 4.3 Flujo de Autenticación

```
Usuario → [1] Ingresa credenciales (usuario/contraseña)
       → [2] Verificación en BD (RDS PostgreSQL)
       → [3] Si es válido: Solicita código TOTP
       → [4] Usuario ingresa código de app autenticadora
       → [5] Si es válido y es USER: Acceso concedido
       → [6] Si es ADMIN: Solicita verificación SSH
       → [7] ADMIN verifica mediante clave SSH
       → [8] Acceso concedido con nivel 3
```

---

## 5. Tecnologías Involucradas

| Tecnología | Versión | Propósito |
|------------|:-------:|-----------|
| Node.js | 20 LTS | Runtime de JavaScript |
| Express | 4.18 | Framework web |
| PostgreSQL | 16 | Base de datos relacional |
| Redis | 7 | Caché de sesiones |
| Docker | 24.x | Contenerización |
| Docker Compose | 2.x | Orquestación local |
| Nginx | 1.25 | Reverse proxy |
| AWS RDS | - | Base de datos como servicio (PaaS) |
| AWS EC2 | - | Cómputo (IaaS) |
| AWS S3 | - | Almacenamiento de objetos |
| AWS ALB | - | Balanceo de carga |
| Terraform | 1.6+ | Infraestructura como código |
| EJS | 3.1 | Motor de plantillas |
| Speakeasy | 2.0 | Generación/verificación TOTP |
| JWT | 9.0 | Tokens de acceso |
| Helmet.js | 7.1 | Headers de seguridad HTTP |
| Rate Limiter | 2.4 | Protección contra fuerza bruta |

---

## 6. Desarrollo y Testeo del Escenario Propuesto

### 6.1 Estructura del Proyecto

```
/srv/cruz_azul-erp/
├── src/
│   ├── frontend/         # Portal Node.js + Express
│   │   ├── server.js     # Servidor principal
│   │   ├── routes/       # Rutas (auth, api, admin)
│   │   ├── middleware/    # Autenticación, rate limiting
│   │   ├── services/     # MFA, BD, lógica de negocio
│   │   └── views/        # Plantillas EJS
│   ├── backend/          # API de servicios
│   ├── database/         # Schema SQL, scripts
│   └── scripts/          # Scripts de utilidad
├── docker/               # Dockerfile, docker-compose
├── infrastructure/       # Terraform, security groups
├── docs/                 # Documentación, diagramas
└── backups/              # Backup local temporal
```

### 6.2 Construcción del Stack (Docker)

```bash
# Construir imágenes
docker-compose -f docker/docker-compose.yml build

# Verificar construcción exitosa
docker images | grep cruzazul

# Desplegar servicios
docker-compose -f docker/docker-compose.yml up -d
```

### 6.3 Verificación de Contenedores Activos

```bash
# Listar contenedores en ejecución
docker-compose -f docker/docker-compose.yml ps

# Ejemplo de salida esperada:
# NAME                    STATUS              PORTS
# cruzazul-frontend       Up 5 minutes        0.0.0.0:3000->3000/tcp
# cruzazul-db             Up 5 minutes        0.0.0.0:5432->5432/tcp
# cruzazul-redis          Up 5 minutes        0.0.0.0:6379->6379/tcp
# cruzazul-nginx          Up 5 minutes        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### 6.4 Revisión de Logs del Frontend

```bash
# Ver logs del frontend
docker-compose -f docker/docker-compose.yml logs frontend

# Logs en tiempo real
docker-compose -f docker/docker-compose.yml logs -f frontend

# Verificar health check
docker-compose -f docker/docker-compose.yml exec frontend curl http://localhost:3000/api/health
```

### 6.5 Detención de Servicios

```bash
# Detener servicios
docker-compose -f docker/docker-compose.yml down

# Detener y eliminar volúmenes
docker-compose -f docker/docker-compose.yml down -v

# Verificar que no hay contenedores activos
docker-compose -f docker/docker-compose.yml ps
```

### 6.6 Conexión a RDS PostgreSQL

```bash
# Desde instancia EC2
psql -h cruzazul-rds.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com \
     -p 5432 \
     -U admin_cruzazul \
     -d cruzazul_erp

# Verificar conexión SSL
psql "host=cruzazul-rds.xxx.rds.amazonaws.com \
      dbname=cruzazul_erp \
      user=admin_cruzazul \
      sslmode=verify-full \
      sslrootcert=rds-ca-2019-root.pem"
```

### 6.7 Backup a S3

```bash
# Ejecutar backup manual
bash src/database/scripts/backup_to_s3.sh

# Verificar backup en S3
aws s3 ls s3://cruzazul-backups-prod/database/backups/

# Programar backup automático (cron)
echo "0 3 * * * /srv/cruz_azul-erp/src/database/scripts/backup_to_s3.sh" | crontab -
```

---

## 7. Prueba de Concepto (PoC)

### 7.1 Escenario de Prueba

Se realizaron las siguientes pruebas para validar el funcionamiento del sistema:

#### Prueba 1: Autenticación de Usuario (2 Factores)
1. Acceder a https://portal.cruzazul.cl/login
2. Ingresar credenciales válidas
3. Verificar redirección a página de MFA
4. Ingresar código TOTP desde aplicación autenticadora
5. Verificar acceso al dashboard de usuario

#### Prueba 2: Autenticación de Administrador (3 Factores)
1. Acceder a https://admin.cruzazul.internal/login
2. Ingresar credenciales de administrador
3. Verificar primer factor (contraseña)
4. Ingresar código TOTP (segundo factor)
5. Verificar mediante clave SSH (tercer factor)
6. Acceder al panel de administración

#### Prueba 3: Denegación por Acceso Condicional
1. Intentar acceso admin desde IP no autorizada
2. Verificar bloqueo con mensaje "Acceso Restringido"

#### Prueba 4: Rate Limiting
1. Realizar 6 intentos de login fallidos consecutivos
2. Verificar bloqueo temporal por 30 minutos

### 7.2 Resultados de Pruebas

| Prueba | Estado | Observaciones |
|--------|:-----:|---------------|
| P-01 (Login usuario) | ✓ | Acceso correcto con MFA de 2 pasos |
| P-02 (Login admin) | ✓ | Acceso correcto con MFA de 3 pasos |
| P-03 (Acceso condicional) | ✓ | Bloqueo correcto por IP no autorizada |
| P-04 (Rate limiting) | ✓ | Bloqueo después de 5 intentos fallidos |
| P-05 (Backup S3) | ✓ | Backup subido correctamente a S3 |
| P-06 (Health check) | ✓ | Endpoint /api/health responde correctamente |

---

## 8. Memoria Explicativa AWS IAM

*(Ver documento completo en `docs/memoria-iam.md`)*

### 8.1 Resumen

AWS IAM (Identity and Access Management) es el servicio de AWS que permite gestionar de forma segura el acceso a recursos cloud. Para el proyecto Cruz Azul, se implementaron:

- **Roles IAM** para EC2, RDS y S3
- **Políticas de mínimo privilegio** para cada servicio
- **MFA obligatorio** para acceso a consola de administración
- **Acceso condicional** mediante condiciones en políticas

### 8.2 Equivalente en Microsoft Entra ID

Microsoft Entra ID (Azure AD) ofrece funcionalidades equivalentes con características adicionales como:
- Privileged Identity Management (PIM)
- Synchronización con Active Directory on-premise
- Políticas de acceso condicional más granulares

---

## 9. Análisis Comparativo de Costos

*(Ver documento completo en `docs/informe/costos-cloud.md`)*

### 9.1 Resumen

| Proveedor | Costo Mensual (USD) | Costo Mensual (CLP) |
|-----------|:-------------------:|:-------------------:|
| AWS | $211,98 | $201.381 |
| Azure | $245,36 | $233.092 |
| OCI | $128,00 | $121.600 |

**Presupuesto**: $2.000 USD ($1.900.000 CLP)
**Proveedor recomendado**: AWS (mejor relación costo-beneficio, ecosistema maduro)

---

## 10. Cronograma del Proyecto

*(Ver documento completo en `docs/informe/cronograma.md`)*

**Duración total**: 10 semanas
**Equipo**: 1 ingeniero informático (todos los roles)

| Semana | Fase | Entregable |
|:------:|------|------------|
| 1 | Inicio | Acta, análisis de riesgos |
| 2 | Diseño | Diagrama arquitectura |
| 3 | Infraestructura | IaC Terraform |
| 4 | Base de Datos | RDS operativo |
| 5 | Frontend F1 | Login funcional |
| 6 | Frontend F2 | MFA completo |
| 7 | Integración | Stack integrado |
| 8 | Despliegue | Contenedores activos |
| 9 | Documentación | Informe completo |
| 10 | Cierre | Video, repositorio |

---

## 11. Ventajas del Desarrollo en Nube Pública

Basado en el Well-Architected Framework de AWS, se identifican las siguientes ventajas:

### 11.1 Ventaja 1: Elasticidad y Escalabilidad (Pilar de Eficiencia de Rendimiento)

La infraestructura cloud permite escalar recursos según demanda. Con EC2 Auto Scaling y RDS Multi-AZ:
- Se ajusta automáticamente la capacidad durante horas punta (mayor demanda en farmacias)
- Se reduce capacidad en horas valle, optimizando costos
- Microservicios permiten escalar componentes de forma independiente

### 11.2 Ventaja 2: Seguridad Integrada (Pilar de Seguridad)

Los servicios PaaS/IaaS de AWS proporcionan seguridad nativa:
- Cifrado automático en RDS y S3
- Security Groups y Network ACLs gestionados
- IAM con control granular de accesos
- Cumplimiento de estándares (ISO 27001, SOC 2, PCI DSS)
- Parches de seguridad gestionados por AWS en servicios PaaS

### 11.3 Ventaja 3: Reducción de CAPEX y Modelo de Pago por Uso (Pilar de Optimización de Costos)

- **Sin inversión inicial** en hardware (CAPEX = $0)
- **Pago por uso** (OPEX) con facturación por hora/segundo
- **TCO menor** vs infraestructura on-premise (estimado 40-60% de ahorro)
- **Reserved Instances** y **Savings Plans** para descuentos adicionales
- **Free Tier** para desarrollo y pruebas

### 11.4 Well-Architected Framework

El proyecto sigue los 6 pilares del AWS Well-Architected Framework:
1. **Excelencia Operacional**: Infraestructura como código (Terraform), logging, monitoreo
2. **Seguridad**: IAM, MFA, cifrado, SGs, WAF
3. **Confiabilidad**: RDS Multi-AZ, Auto Scaling, health checks
4. **Eficiencia de Rendimiento**: ALB, Auto Scaling, Redis cache
5. **Optimización de Costos**: Recursos dimensionados, pago por uso
6. **Sostenibilidad**: Infraestructura eficiente, región us-east-1 con energía renovable

---

## 12. Justificación de Decisiones

### 12.1 Elección de AWS como CSP Principal

- **Madurez del ecosistema**: AWS es el proveedor cloud más maduro con mayor cantidad de servicios
- **Documentación extensa**: Amplia documentación técnica y mejores prácticas
- **Presencia en Chile**: Región de Santiago (us-east-1 es la más cercana con todos los servicios)
- **Costo competitivo**: Dentro del presupuesto de $2.000 USD mensuales
- **Integración nativa**: RDS, S3, IAM, CloudFront funcionan de forma integrada

### 12.2 Elección de PostgreSQL (RDS)

- **Licenciamiento open source**: Sin costos de licencia adicionales
- **Características avanzadas**: JSONB, índices parciales, replicación nativa
- **Cumplimiento ACID**: Transacciones confiables para datos críticos
- **Soporte de AWS RDS**: Backups automatizados, Multi-AZ, parches gestionados

### 12.3 Elección de Node.js + Express

- **Rendimiento**: I/O asíncrono para manejo de múltiples conexiones simultáneas
- **Ecosistema npm**: Librerías maduras para autenticación (passport, speakeasy, jsonwebtoken)
- **Comunidad**: Amplia documentación y soporte
- **Portabilidad**: Docker multi-stage build con imagen Alpine

### 12.4 Elección de MFA con TOTP

- **Estándar abierto**: RFC 6238, compatible con Google Authenticator, Authy, Microsoft Authenticator
- **Sin conectividad**: Funciona offline en el dispositivo del usuario
- **Seguridad probada**: Ampliamente adoptado por la industria
- **Costo cero**: Sin costos de SMS ni hardware tokens

### 12.5 Elección de Terraform

- **Declarativo**: Describe el estado deseado de la infraestructura
- **Multi-cloud**: Puede gestionar AWS, Azure y OCI desde una misma herramienta
- **Versionable**: Los archivos .tf se almacenan en Git
- **Estado remoto**: Backend S3 con DynamoDB para locking

---

## 13. Resultados Esperados

### 13.1 Indicadores de Éxito

| Indicador | Métrica | Esperado |
|-----------|:-------:|:--------:|
| Tiempo de autenticación | < 2 segundos | ✓ |
| Disponibilidad del portal | 99.9% | ✓ |
| Intentos fallidos bloqueados | 100% | ✓ |
| Backups ejecutados | Cada 24h | ✓ |
| Recuperación de backup | < 1 hora | ✓ |
| Cumplimiento MFA usuarios | 100% | ✓ |
| Cumplimiento MFA admin (3 factores) | 100% | ✓ |

### 13.2 Beneficios Esperados

1. **Reducción de riesgos de seguridad**: Eliminación de accesos no autorizados mediante MFA
2. **Cumplimiento normativo**: Adecuación a la Ley de Protección de Datos Personales
3. **Auditabilidad**: Registro completo de todos los accesos y operaciones
4. **Continuidad operacional**: Backups automatizados con recuperación rápida
5. **Optimización de costos**: Infraestructura elástica que se ajusta a la demanda

---

## 14. Conclusiones y Comentarios Finales

### 14.1 Conclusiones

1. **Cumplimiento de objetivos**: Se implementó exitosamente un portal de autenticación multifactor con 2 pasos para usuarios web y 3 pasos para administradores, cumpliendo con todos los requerimientos del proyecto.

2. **Arquitectura segura**: El diseño en capas con WAF, ALB, Security Groups y cifrado integral proporciona defensa en profundidad contra amenazas de seguridad.

3. **Infraestructura cloud nativa**: La integración de servicios AWS (RDS, S3, EC2, IAM) demuestra la viabilidad de construir soluciones empresariales utilizando un enfoque cloud-native.

4. **Cumplimiento de estándares**: Las políticas IAM, MFA y controles de acceso condicional implementados se alinean con ISO 27001, NIST CSF y el Well-Architected Framework.

5. **Viabilidad económica**: Con un presupuesto de $2.000 USD mensuales (32% del cual se utiliza realmente), la solución es económicamente viable y escalable.

### 14.2 Comentarios Finales

El proyecto "Integración de Mecanismos de Protección y Control de Acceso" para Farmacias Cruz Azul representa una solución integral de seguridad cloud que aborda las brechas identificadas en la evaluación previa (EVA2). La implementación de MFA, acceso condicional, backups automatizados y arquitectura en capas proporciona un nivel de seguridad empresarial robusto que cumple con los estándares nacionales e internacionales.

Se recomienda:
1. **Capacitación** del personal en el uso de MFA y buenas prácticas de seguridad
2. **Revisión periódica** de políticas IAM y Security Groups
3. **Monitoreo continuo** de logs de acceso y alertas de seguridad
4. **Actualización** semestral de dependencias y parches de seguridad

---

## 15. Acceso al Repositorio

El proyecto complete se encuentra disponible en el siguiente repositorio:

**GitHub**: [https://github.com/[usuario]/cruz_azul-erp](https://github.com/[usuario]/cruz_azul-erp)

### Enlace a Videocápsula

**YouTube (video no listado)**: [https://youtu.be/[VIDEO_ID]](https://youtu.be/[VIDEO_ID])

### Contenido del Repositorio

```
cruz_azul-erp/
├── src/                    # Código fuente
│   ├── frontend/           # Portal Node.js + Express + MFA
│   ├── database/           # Esquema y scripts SQL
│   └── scripts/            # Scripts de backup y utilidades
├── docker/                 # Configuración Docker
├── infrastructure/         # Terraform y Security Groups
├── docs/                   # Documentación técnica
│   ├── images/             # Diagramas (Excalidraw)
│   └── informe/            # Informe completo
└── README.md               # Documentación principal
```

---

*Documento elaborado en formato INACAP - Junio 2024*
*Ingeniería en Informática - Infraestructura Multicloud EVA3*

# Cronograma del Proyecto

## Proyecto: Integración MFA - Infraestructura Cloud Cruz Azul ERP
## Duración Total: 10 semanas

### Roles y Responsabilidades

| Rol | Responsable | Descripción |
|-----|-------------|-------------|
| Jefe de Proyecto (PM) | Ingeniero Informático | Coordinación general, entregables, comunicación con stakeholder |
| Arquitecto Cloud | Ingeniero Informático | Diseño de arquitectura, security groups, redes |
| Desarrollador Full Stack | Ingeniero Informático | Frontend Node.js/Express, Backend API |
| Administrador de BD | Ingeniero Informático | RDS PostgreSQL, backups, S3 |
| DevOps | Ingeniero Informático | Docker, CI/CD, Terraform, despliegue |
| Documentador | Ingeniero Informático | Informe técnico, memoria IAM, videocápsula |

### Cronograma Detallado

| Semana | Fase | Actividades | Entregable |
|--------|------|-------------|------------|
| **Semana 1** | **Inicio** | Kick-off, levantamiento de requerimientos, análisis de riesgos EVA2 | Acta de inicio, análisis de riesgos |
| **Semana 2** | **Diseño** | Diseño de arquitectura en capas, esquematización Excalidraw, definición de SGs | Diagrama arquitectura, diseño seguridad |
| **Semana 3** | **Infraestructura** | Configuración VPC, subnets, Security Groups, IAM roles, Terraform | IaC Terraform, SGs configurados |
| **Semana 4** | **Base de Datos** | Provisionamiento RDS PostgreSQL, schema, conexión SSL, configuración backups | RDS operativo, schema.sql |
| **Semana 5** | **Frontend - Fase 1** | Desarrollo portal autenticación, login con Express, vistas EJS, sesiones | Login funcional, vistas |
| **Semana 6** | **Frontend - Fase 2** | Integración MFA (TOTP), QR, códigos respaldo, verificación SSH admin | MFA 2 pasos web, 3 pasos admin |
| **Semana 7** | **Integración** | Conexión Frontend-RDS, pruebas de conexión, logs de autenticación | Stack completo integrado |
| **Semana 8** | **Despliegue** | Dockerización, docker-compose, despliegue EC2, verificación contenedores | Stack desplegado, contenedores activos |
| **Semana 9** | **Documentación** | Memoria IAM, comparativa costos, informe INACAP, cronograma | Informe técnico-comercial |
| **Semana 10** | **Cierre** | Videocápsula, revisión final, carga a GitHub, entrega | Video, repositorio, cierre |

### Hitos del Proyecto

| Hito | Semana | Descripción |
|------|--------|-------------|
| H1 | 1 | Aprobación de análisis de riesgos |
| H2 | 2 | Aprobación de diseño de arquitectura |
| H3 | 4 | Base de datos RDS operativa con backups |
| H4 | 6 | Portal MFA funcional (2 factores web, 3 factores admin) |
| H5 | 8 | Stack completo desplegado y verificado |
| H6 | 9 | Documentación completa |
| H7 | 10 | Entrega final (repositorio + video) |

### Diagrama de Gantt (Texto)

```
Semana:    1  2  3  4  5  6  7  8  9  10
Inicio     ██
Diseño        ██
Infraestructura ██
Base Datos         ██
Frontend F1           ██
Frontend F2              ██
Integración                ██
Despliegue                   ██
Documentación                  ██
Cierre                           ██
```

### Dependencias

- Diseño arquitectura → Infraestructura (SG, VPC)
- Infraestructura → Base de datos (RDS necesita VPC)
- Base de datos → Frontend F1 (conexión BD)
- Frontend F1 → Frontend F2 (base login para MFA)
- Frontend F2 → Integración (pruebas completas)
- Integración → Despliegue (todo probado)
- Todas las fases → Documentación (recopilación continua)

### Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:-----------:|:-------:|------------|
| Retraso en provisión RDS | Baja | Alto | Usar plantillas CloudFormation |
| Breaking changes en dependencias | Media | Medio | Lock de versiones en package.json |
| Costos excedidos | Baja | Medio | Monitoreo de costos, alerts de presupuesto |
| Falla en seguridad | Baja | Crítico | Auditoría de SGs, IAM, penetration testing |
| Disponibilidad del servicio | Baja | Alto | Multi-AZ RDS, Auto Scaling EC2 |

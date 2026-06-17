# Memoria Explicativa: AWS IAM (Identity and Access Management)

## 1. Introducción a AWS IAM

AWS Identity and Access Management (IAM) es un servicio web que ayuda a controlar de forma segura el acceso a los recursos de AWS. IAM permite gestionar usuarios, grupos, roles y sus permisos para determinar qué operaciones pueden realizar sobre los diferentes servicios de AWS.

## 2. Componentes Principales de IAM

### 2.1 Usuarios IAM
Representan una entidad física (persona o aplicación) que interactúa con AWS. Cada usuario tiene credenciales únicas y permisos específicos.

### 2.2 Grupos IAM
Colecciones de usuarios que comparten permisos comunes. Facilitan la administración granular de políticas.

### 2.3 Roles IAM
Identidades temporales que pueden ser asumidas por usuarios, aplicaciones o servicios AWS. Proporcionan credenciales temporales a través de AWS STS (Security Token Service).

### 2.4 Políticas IAM
Documentos JSON que definen permisos. Existen dos tipos:
- **Políticas administradas**: Creadas y gestionadas por AWS o el cliente
- **Políticas inline**: Asociadas directamente a una identidad

## 3. Principios de Mínimo Privilegio

IAM opera bajo el principio de **mínimo privilegio**, otorgando únicamente los permisos necesarios para realizar una tarea específica. Esto reduce la superficie de ataque y limita el impacto de potenciales brechas de seguridad.

## 4. Autenticación Multifactor (MFA) en IAM

IAM soporta MFA mediante:
- Dispositivos virtuales (Google Authenticator, Authy)
- Llaves de seguridad hardware (YubiKey)
- MFA con dispositivos SMS/email para la consola AWS

## 5. Control de Accesos en IAM

### 5.1 Políticas Basadas en Identidad
Controlan qué acciones puede realizar una identidad en qué recursos:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "rds:DescribeDBInstances"
      ],
      "Resource": "*"
    }
  ]
}
```

### 5.2 Políticas Basadas en Recursos
Se asocian a recursos como S3 buckets o KMS keys:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/BackupRole"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::cruzazul-backups/*"
    }
  ]
}
```

### 5.3 Límites de Permisos
Establecen el máximo de permisos que una identidad puede tener.

## 6. IAM en Arquitectura Cruz Azul

### Roles IAM Implementados

| Rol | Servicio | Permisos |
|-----|----------|----------|
| EC2-Frontend-Role | EC2 | SES (email OTP), S3 (logs) |
| RDS-Backup-Role | Lambda/EventBridge | RDS snapshot, S3 PutObject |
| Admin-Role | Humanos | Acceso completo con MFA obligatorio |
| Auditor-Role | Humanos | Solo lectura de logs y configuraciones |

### Políticas de Acceso Condicional

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
```

## 7. Equivalente en Microsoft Entra ID (Azure AD)

Azure Active Directory (ahora Microsoft Entra ID) es el servicio equivalente a AWS IAM en Azure:

### Comparativa AWS IAM vs Microsoft Entra ID

| Característica | AWS IAM | Microsoft Entra ID |
|---------------|---------|-------------------|
| Usuarios | ✓ | ✓ (con sincronización on-prem) |
| Grupos | ✓ | ✓ (anidamiento soportado) |
| Roles | ✓ | ✓ (RBAC + Azure AD Roles) |
| Políticas | JSON-based | JSON + Portal GUI |
| MFA | ✓ (Virtual MFA, Hardware) | ✓ (Authenticator, FIDO2, SMS) |
| Acceso Condicional | IAM Conditions | Conditional Access Policies |
| SSO | AWS SSO / IAM Identity Center | Entra ID SSO + Federation |
| PIM (Privileged Identity Mgmt) | No nativo | ✓ Privileged Identity Management |
| Precio | Sin costo adicional | Incluido con licencias P1/P2 |

### Microsoft Entra ID - Políticas de Acceso Condicional

Equivalente a las condiciones de IAM, las políticas de Acceso Condicional en Entra ID permiten:
- Señales de riesgo en tiempo real
- Bloqueo geográfico
- Cumplimiento de dispositivo (Intune)
- MFA adaptativo según riesgo

## 8. Evaluación de Aplicación

### AWS IAM en Cruz Azul
- **Fortalezas**: Control granular, integración nativa con AWS, sin costo adicional
- **Debilidades**: Curva de aprendizaje, gestión manual compleja a gran escala
- **Recomendación**: Usar AWS Organizations + SCP para gobernanza multi-cuenta

### Microsoft Entra ID (Hipótetico)
- **Fortalezas**: Integración con Active Directory on-premise, PIM, políticas de acceso condicional robustas
- **Debilidades**: Costo adicional por características premium
- **Recomendación**: Adecuado si la organización ya usa Microsoft 365

## 9. Mejores Prácticas IAM

1. **No usar root user** para operaciones diarias
2. **Habilitar MFA** para todos los usuarios
3. **Usar roles** en lugar de compartir credenciales
4. **Rotar credenciales** periódicamente
5. **Usar políticas administradas** sobre inline
6. **Implementar Access Analyzer** para detectar accesos no intencionados
7. **Auditar con CloudTrail** todas las acciones IAM
8. **Usar condiciones** para restringir acceso por IP, hora o MFA

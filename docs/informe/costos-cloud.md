# Análisis Comparativo de Costos Cloud

## Contexto

Proyecto: Infraestructura Cloud para Cruz Azul ERP
Presupuesto asignado: **2.000 USD mensuales**
Tipo de cambio referencia (junio 2024): **1 USD = 950 CLP**
Presupuesto en CLP: **2.000 USD × 950 = $1.900.000 CLP mensuales**

## Comparativa de Proveedores Cloud

### 1. Amazon Web Services (AWS)

| Servicio | Configuración | Costo Mensual (USD) |
|----------|--------------|-------------------:|
| EC2 (Frontend) | t3.medium (2vCPU, 4GB) + Auto Scaling x2 | $61.68 |
| RDS PostgreSQL | db.t3.small (2vCPU, 2GB) Multi-AZ | $52.00 |
| S3 + Glacier | 100GB Standard + 500GB Glacier | $5.80 |
| Application Load Balancer | 1 ALB + 2 nodos | $24.00 |
| CloudFront | 1TB transfer | $8.50 |
| CloudWatch | Logs + Métricas | $5.00 |
| WAF | 1 Web ACL | $10.00 |
| Data Transfer Saliente | 500GB/mes | $45.00 |
| **Subtotal AWS** | | **$211.98** |

**Costo mensual estimado AWS: ~$212 USD (~$201.400 CLP)**

### 2. Microsoft Azure

| Servicio | Configuración | Costo Mensual (USD) |
|----------|--------------|-------------------:|
| VM (Frontend) | B2ms (2vCPU, 8GB) x2 | $70.56 |
| Azure Database for PostgreSQL | GP v2 (2vCore, 10GB) | $58.00 |
| Blob Storage | 100GB Hot + 500GB Cool | $4.60 |
| Load Balancer | Standard LB | $22.00 |
| Azure CDN | 1TB transfer | $7.20 |
| Monitor + Logs | Log Analytics | $8.00 |
| WAF (Front Door) | Azure Front Door + WAF | $35.00 |
| Data Transfer | 500GB/mes | $40.00 |
| **Subtotal Azure** | | **$245.36** |

**Costo mensual estimado Azure: ~$245 USD (~$232.750 CLP)**

### 3. Oracle Cloud Infrastructure (OCI)

| Servicio | Configuración | Costo Mensual (USD) |
|----------|--------------|-------------------:|
| Compute (Frontend) | VM.Standard.E2.2 (2vCPU, 16GB) x2 | $49.20 |
| PostgreSQL (OCI Base DB) | 2 OCPU, 40GB storage | $45.00 |
| Object Storage | 100GB Standard + 500GB Archive | $3.80 |
| Load Balancer | Flexible LB | $18.00 |
| Web Application Firewall | WAF Policy | $8.00 |
| Monitoring | Monitoring + Logging | $4.00 |
| Data Transfer | 500GB/mes gratuitos | $0.00 |
| **Subtotal OCI** | | **$128.00** |

**Costo mensual estimado OCI: ~$128 USD (~$121.600 CLP)**

## Resumen Comparativo

| Concepto | AWS | Azure | OCI |
|----------|:---:|:-----:|:---:|
| Compute (Frontend) | $61.68 | $70.56 | $49.20 |
| Base de Datos (PaaS) | $52.00 | $58.00 | $45.00 |
| Almacenamiento | $5.80 | $4.60 | $3.80 |
| Networking/LB | $24.00 | $22.00 | $18.00 |
| CDN/WAF | $18.50 | $42.20 | $8.00 |
| Monitoreo | $5.00 | $8.00 | $4.00 |
| Transferencia de Datos | $45.00 | $40.00 | $0.00* |
| **Total Mensual** | **$211.98** | **$245.36** | **$128.00** |
| **Total CLP** | **$201.381** | **$233.092** | **$121.600** |
| **Presupuesto Restante** | **$1.698.619** | **$1.666.908** | **$1.778.400** |

*OCI incluye 10TB/mes de transferencia saliente gratuita

## Análisis CAPEX, OPEX y TCO

### AWS
- **CAPEX**: $0 (pago por uso)
- **OPEX Mensual**: $212 USD
- **TCO Anual**: $212 × 12 = **$2.544 USD**
- **Ventaja**: Modelo maduro, mayor cantidad de servicios, ecosistema extenso

### Azure
- **CAPEX**: $0 (pago por uso)
- **OPEX Mensual**: $245 USD
- **TCO Anual**: $245 × 12 = **$2.940 USD**
- **Ventaja**: Integración con Active Directory, híbrido on-premise

### OCI
- **CAPEX**: $0 (pago por uso)
- **OPEX Mensual**: $128 USD
- **TCO Anual**: $128 × 12 = **$1.536 USD**
- **Ventaja**: Mejor relación costo-rendimiento, transferencia de datos gratuita

## Recomendación

Considerando el presupuesto de **2.000 USD mensuales**, los tres proveedores son viables. Sin embargo:

1. **AWS** ofrece el mejor equilibrio entre costo, madurez de servicios y documentación para el proyecto Cruz Azul.
2. **OCI** es significativamente más económico pero tiene menor presencia en el mercado chileno.
3. Servicios gestionados como RDS y CloudFront reducen el OPEX operacional.

Se recomienda **AWS** para este proyecto dado su ecosistema maduro de seguridad, disponibilidad de servicios gestionados y costos predecibles dentro del presupuesto.

## Conversión Detallada USD → CLP

| Concepto | USD | CLP (tasa 950) |
|----------|:---:|:--------------:|
| Presupuesto Mensual | $2.000,00 | $1.900.000 |
| Costo AWS | $211,98 | $201.381 |
| Costo Azure | $245,36 | $233.092 |
| Costo OCI | $128,00 | $121.600 |
| Ahorro vs Presupuesto (AWS) | $1.788,02 | $1.698.619 |

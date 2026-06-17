output "infrastructure_summary" {
  description = "Resumen de la infraestructura desplegada"
  value = <<EOF

========================================
  CRUZ AZUL ERP - INFRAESTRUCTURA CLOUD
========================================

VPC ID:               ${aws_vpc.main.id}
VPC CIDR:             ${aws_vpc.main.cidr_block}
ALB DNS:              ${aws_lb.main.dns_name}
RDS Endpoint:         ${aws_db_instance.postgres.endpoint}
RDS Database:         ${aws_db_instance.postgres.db_name}
S3 Backups Bucket:    ${aws_s3_bucket.backups.id}
Security Groups:
  - ALB:              ${aws_security_group.alb.name}
  - EC2 Frontend:     ${aws_security_group.ec2.name}
  - RDS PostgreSQL:   ${aws_security_group.rds.name}

========================================
  SEGURIDAD IMPLEMENTADA
========================================
- SSL/TLS 1.3 en ALB
- RDS Multi-AZ con cifrado
- Backups cifrados en S3
- SGs con mínimo privilegio
- Bloqueo de acceso público a S3
- Deletion protection en RDS

========================================
EOF
}

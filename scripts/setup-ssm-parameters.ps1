# ==============================================================================
# Helper Script: Initialize AWS SSM Parameter Store Secrets
# ==============================================================================
# This script provisions placeholder parameters in AWS SSM Parameter Store
# using KMS encryption (SecureString).
#
# Keeping SSM parameter creation out of Terraform state guarantees that
# real secret values are NEVER written or captured in .tfstate files.
#
# Usage:
#   .\scripts\setup-ssm-parameters.ps1 -Region "ap-south-1" -Environment "prod"
# ==============================================================================

param(
  [string]$Region = "ap-south-1",
  [string]$ProjectName = "runway",
  [string]$Environment = "prod"
)

$secrets = @(
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "REFRESH_TOKEN_HASH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
  "ADMIN_SEED_PASSWORD",
  "SENTRY_BACKEND_DSN",
  "GRAFANA_CLOUD_PROMETHEUS_URL",
  "GRAFANA_CLOUD_PROMETHEUS_USER",
  "GRAFANA_CLOUD_API_KEY"
)

Write-Host "Configuring SSM parameters under /$ProjectName/$Environment/ in region $Region..."

foreach ($name in $secrets) {
  $paramName = "/$ProjectName/$Environment/$name"
  
  # Check if parameter already exists to avoid overwriting real credentials
  $existing = aws ssm get-parameter --name $paramName --region $Region 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  [EXISTS] Parameter $paramName already present in SSM. Skipping."
  } else {
    Write-Host "  [CREATING] Initializing placeholder for $paramName..."
    aws ssm put-parameter `
      --name $paramName `
      --type "SecureString" `
      --value "placeholder_change_me" `
      --region $Region `
      --description "Managed out-of-band via AWS CLI / Console"
  }
}

Write-Host "SSM configuration complete."

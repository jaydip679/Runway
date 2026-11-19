output "terraform_state_bucket" {
  description = "The S3 bucket name for Terraform remote state"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_state_bucket_arn" {
  description = "The S3 bucket ARN for Terraform remote state"
  value       = aws_s3_bucket.terraform_state.arn
}

output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = aws_ecr_repository.runway_backend.repository_url
}

output "ecr_repository_name" {
  description = "The name of the ECR repository"
  value       = aws_ecr_repository.runway_backend.name
}

output "github_actions_role_arn" {
  description = "The IAM Role ARN for GitHub Actions deployment"
  value       = aws_iam_role.github_actions_role.arn
}

output "aws_region" {
  description = "AWS Region configured for Runway"
  value       = var.aws_region
}

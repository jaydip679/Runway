output "alb_dns_name" {
  description = "Public HTTP endpoint URL for Runway API via ALB"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecs_cluster_name" {
  description = "ECS Cluster Name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS Service Name"
  value       = aws_ecs_service.app.name
}

output "task_definition_family" {
  description = "ECS Task Definition Family"
  value       = aws_ecs_task_definition.app.family
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "frontend_url" {
  description = "Public HTTPS endpoint URL for standalone AWS Runway Full-Stack deployment"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "frontend_s3_bucket" {
  description = "S3 bucket name hosting the React frontend production build"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID for cache invalidations"
  value       = aws_cloudfront_distribution.main.id
}

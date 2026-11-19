variable "aws_region" {
  description = "AWS region for disposable prod resources"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "runway"
}

variable "app_image" {
  description = "ECR Docker image URI for runway-backend"
  type        = string
  default     = "109257212327.dkr.ecr.ap-south-1.amazonaws.com/runway-backend:latest"
}

variable "alloy_image" {
  description = "Docker image for Grafana Alloy collector sidecar"
  type        = string
  default     = "grafana/alloy:v1.5.1"
}

variable "use_fargate_spot" {
  description = "Whether to use Fargate Spot (70% cost savings) instead of standard On-Demand Fargate"
  type        = bool
  default     = false
}

variable "desired_count" {
  description = "Desired number of ECS task replicas"
  type        = number
  default     = 1
}

variable "task_cpu" {
  description = "Total CPU units allocated to the ECS task (512 = 0.5 vCPU)"
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Total memory (MiB) allocated to the ECS task (1024 = 1.0 GiB)"
  type        = number
  default     = 1024
}

variable "client_url" {
  description = "Allowed frontend client origin (preserves Vercel frontend)"
  type        = string
  default     = "https://runwayfinance.vercel.app"
}

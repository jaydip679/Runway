variable "aws_region" {
  description = "AWS region for persistent bootstrap resources"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used for tagging and resource naming prefixes"
  type        = string
  default     = "runway"
}

variable "github_repository" {
  description = "GitHub repository formatted as owner/repo for OIDC trust (e.g. your-github-user/your-repo)"
  type        = string
}

variable "budget_alert_email" {
  description = "Email address to receive AWS Budget threshold notifications"
  type        = string
}

variable "budget_limit_usd" {
  description = "Monthly budget spending limit in USD"
  type        = string
  default     = "40.0"
}

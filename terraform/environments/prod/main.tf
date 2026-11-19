terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
  }

  backend "s3" {
    bucket       = "runway-tf-state-109257212327-ap-south-1"
    key          = "prod/terraform.tfstate"
    region       = "ap-south-1"
    use_lockfile = true # Native S3 locking (Terraform 1.10+, no DynamoDB required)
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ALB Security Group: Accepts public HTTP traffic
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Allows inbound HTTP traffic to Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Public HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Forward HTTP to ECS Tasks on port 4000"
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-sg"
  }
}

# ECS Tasks Security Group: Strictly restricted to ALB traffic only
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-${var.environment}-ecs-tasks-sg"
  description = "Allows inbound traffic only from ALB, unrestricted outbound"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Inbound port 4000 strictly from ALB Security Group"
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Outbound internet access for DB, Redis, ECR pulls, and Grafana Cloud"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-tasks-sg"
  }
}

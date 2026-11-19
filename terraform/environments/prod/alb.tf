# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${var.project_name}-${var.environment}-alb"
  }
}

# Target Group pointing to ECS Tasks (target_type = ip is required for Fargate)
resource "aws_lb_target_group" "app" {
  name                 = "${var.project_name}-${var.environment}-tg"
  port                 = 4000
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = "/health"
    port                = "4000"
    protocol            = "HTTP"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-tg"
  }
}

# HTTP Listener forwarding to Target Group
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Strict Rule: Block external access to /metrics with 403 Forbidden
resource "aws_lb_listener_rule" "block_metrics" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Access Denied: Internal Metrics Only"
      status_code  = "403"
    }
  }

  condition {
    path_pattern {
      values = ["/metrics", "/metrics/*"]
    }
  }
}

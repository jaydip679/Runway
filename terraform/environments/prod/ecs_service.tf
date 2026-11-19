resource "aws_ecs_service" "app" {
  name                   = "${var.project_name}-${var.environment}-service"
  cluster                = aws_ecs_cluster.main.id
  task_definition        = aws_ecs_task_definition.app.arn
  desired_count          = var.desired_count
  enable_execute_command = true

  capacity_provider_strategy {
    capacity_provider = var.use_fargate_spot ? "FARGATE_SPOT" : "FARGATE"
    weight            = 1
    base              = var.use_fargate_spot ? 0 : 1
  }

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true # Required for outbound connectivity without expensive NAT Gateway
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "runway-api"
    container_port   = 4000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_controller {
    type = "ECS"
  }

  depends_on = [
    aws_lb_listener.http,
    aws_lb_listener_rule.block_metrics,
    aws_iam_role_policy_attachment.ecs_execution_standard,
    aws_iam_role_policy_attachment.ecs_execution_ssm
  ]
}

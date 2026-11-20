# CloudWatch Log Group with 7-day retention to keep storage within free tier
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}-${var.environment}"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-logs"
  }
}

locals {
  ssm_param_prefix = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}"

  # Shared environment variables for API and Worker containers
  common_environment = [
    { name = "NODE_ENV", value = "production" },
    { name = "PORT", value = "4000" },
    { name = "LOG_LEVEL", value = "info" },
    { name = "FORECAST_WINDOW_DAYS", value = "60" },
    { name = "LOW_BALANCE_THRESHOLD", value = "0" },
    { name = "CLIENT_URL", value = var.client_url },
    { name = "GOOGLE_CALLBACK_URL", value = "${var.client_url}/api/v1/auth/google/callback" },
    { name = "AI_PROVIDER", value = "openai" },
    { name = "EMAIL_PROVIDER", value = "resend" },
    { name = "EMAIL_FROM", value = "noreply@runwayfinance.vercel.app" },
    { name = "ADMIN_SEED_EMAIL", value = "admin@runway.local" }
  ]

  # Shared database, auth, and service credentials for API and Worker containers
  common_secrets = [
    { name = "DATABASE_URL", valueFrom = "${local.ssm_param_prefix}/DATABASE_URL" },
    { name = "REDIS_URL", valueFrom = "${local.ssm_param_prefix}/REDIS_URL" },
    { name = "JWT_ACCESS_SECRET", valueFrom = "${local.ssm_param_prefix}/JWT_ACCESS_SECRET" },
    { name = "REFRESH_TOKEN_HASH_SECRET", valueFrom = "${local.ssm_param_prefix}/REFRESH_TOKEN_HASH_SECRET" },
    { name = "GOOGLE_CLIENT_ID", valueFrom = "${local.ssm_param_prefix}/GOOGLE_CLIENT_ID" },
    { name = "GOOGLE_CLIENT_SECRET", valueFrom = "${local.ssm_param_prefix}/GOOGLE_CLIENT_SECRET" },
    { name = "CLOUDINARY_CLOUD_NAME", valueFrom = "${local.ssm_param_prefix}/CLOUDINARY_CLOUD_NAME" },
    { name = "CLOUDINARY_API_KEY", valueFrom = "${local.ssm_param_prefix}/CLOUDINARY_API_KEY" },
    { name = "CLOUDINARY_API_SECRET", valueFrom = "${local.ssm_param_prefix}/CLOUDINARY_API_SECRET" },
    { name = "OPENAI_API_KEY", valueFrom = "${local.ssm_param_prefix}/OPENAI_API_KEY" },
    { name = "RESEND_API_KEY", valueFrom = "${local.ssm_param_prefix}/RESEND_API_KEY" },
    { name = "ADMIN_SEED_PASSWORD", valueFrom = "${local.ssm_param_prefix}/ADMIN_SEED_PASSWORD" },
    { name = "SENTRY_BACKEND_DSN", valueFrom = "${local.ssm_param_prefix}/SENTRY_BACKEND_DSN" }
  ]

  # Inline Grafana Alloy Configuration
  alloy_config = <<-EOT
    prometheus.scrape "runway_api" {
      targets = [{
        __address__ = "127.0.0.1:4000",
      }]
      metrics_path = "/metrics"
      scrape_interval = "30s"
      forward_to = [prometheus.remote_write.grafana_cloud.receiver]
    }

    prometheus.remote_write "grafana_cloud" {
      endpoint {
        url = sys.env("GRAFANA_CLOUD_PROMETHEUS_URL")
        basic_auth {
          username = sys.env("GRAFANA_CLOUD_PROMETHEUS_USER")
          password = sys.env("GRAFANA_CLOUD_API_KEY")
        }
      }
    }
  EOT
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-${var.environment}-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = tostring(var.task_cpu)
  memory                   = tostring(var.task_memory)
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    # =========================================================================
    # Container 1: Runway Express API Server (Essential)
    # =========================================================================
    {
      name              = "runway-api"
      image             = var.app_image
      essential         = true
      memoryReservation = 384

      portMappings = [
        {
          containerPort = 4000
          hostPort      = 4000
          protocol      = "tcp"
        }
      ]

      environment = local.common_environment

      secrets = local.common_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }
    },

    # =========================================================================
    # Container 2: Headless BullMQ Worker
    # =========================================================================
    {
      name              = "runway-worker"
      image             = var.app_image
      essential         = false
      memoryReservation = 400
      command           = ["dumb-init", "node", "src/worker.js"]

      environment = local.common_environment

      secrets = local.common_secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "worker"
        }
      }
    },

    # =========================================================================
    # Container 3: Grafana Alloy Telemetry Sidecar
    # =========================================================================
    {
      name              = "grafana-alloy"
      image             = var.alloy_image
      essential         = false
      memoryReservation = 128
      entryPoint        = ["/bin/sh", "-c"]
      command = [
        "echo '${replace(local.alloy_config, "'", "'\\''")}' > /tmp/config.alloy && /bin/alloy run --server.http.listen-addr=127.0.0.1:12345 /tmp/config.alloy"
      ]

      secrets = [
        { name = "GRAFANA_CLOUD_PROMETHEUS_URL", valueFrom = "${local.ssm_param_prefix}/GRAFANA_CLOUD_PROMETHEUS_URL" },
        { name = "GRAFANA_CLOUD_PROMETHEUS_USER", valueFrom = "${local.ssm_param_prefix}/GRAFANA_CLOUD_PROMETHEUS_USER" },
        { name = "GRAFANA_CLOUD_API_KEY", valueFrom = "${local.ssm_param_prefix}/GRAFANA_CLOUD_API_KEY" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "alloy"
        }
      }
    }
  ])
}

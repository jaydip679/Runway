# Runway

Runway — A production-grade personal finance forecasting platform that predicts future cash flow, detects recurring commitments, and helps users make proactive financial decisions with AI-powered insights.

## Project Status

**Current Phase Completed:** Phase 1 (Authentication & User Management)

### Features Implemented
- **Monorepo Structure**: Node.js/Express backend (`server/`) and React/Vite/Tailwind frontend (`client/`).
- **Core Infrastructure**: Prisma, Redis, Winston logger, Zod environment validation.
- **Error Handling**: Global standardized API error envelope.
- **Docker Integration**: `docker-compose` configured for `app`, `worker`, `postgres`, `redis`, and `nginx` reverse proxy.
- **Frontend Backbone**: Vite, React Router, React Query, and Axios API client interceptor skeleton.
- **Health Checks**: `/health` and `/health/ready` endpoints.
- **Authentication**: JWT access/refresh token rotation with OTP-based registration and Redis reuse detection.
- **User Profiles**: User RBAC, profile updates, and avatar uploads.

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Running the Infrastructure
Start the entire stack (Database, Redis, API, Worker, Nginx proxy):
```bash
docker-compose up -d
```

### Running the Backend (Development)
```bash
cd server
npm install
npm run dev
```

### Running the Frontend (Development)
```bash
cd client
npm install
npm run dev
```

### Available Endpoints
- `GET /health` - API liveness
- `GET /health/ready` - Deep dependency health check (Postgres + Redis)
- `/api/docs` - Swagger UI

## License
Internal Engineering Project

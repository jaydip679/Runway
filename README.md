# Runway

Runway — A production-grade personal finance forecasting platform that predicts future cash flow, detects recurring commitments, and helps users make proactive financial decisions with AI-powered insights.

## Project Status

**Current Phase Completed:** Phase 2 (Accounts & Categories)

### Features Implemented & Phase Progress

#### [x] Phase 0: Setup & Infrastructure
- **Monorepo Structure**: Node.js/Express backend (`server/`) and React/Vite/Tailwind frontend (`client/`).
- **Core Infrastructure**: Prisma ORM, Redis for caching, Winston logger for structured logging, and Zod environment validation.
- **Error Handling**: Global standardized API error envelope ensuring consistent client responses.
- **Docker Integration**: Configured `docker-compose` for local orchestration of the `app`, `worker`, `postgres`, `redis`, and an `nginx` reverse proxy.
- **Frontend Backbone**: Initialized Vite, React Router, React Query, and Axios API client with interceptors.
- **Health Checks**: Robust `/health` and deep `/health/ready` endpoints to track dependency status.

#### [x] Phase 1: Authentication & Users
- **Secure Authentication Flow**: Fully implemented JWT access tokens combined with secure HttpOnly refresh token cookies.
- **OTP-Based Registration**: Registration uses 6-digit OTP verification via email with Redis-backed rate limiting and expiry.
- **Security Features**: Token rotation, Refresh token reuse detection, and strict Rate limiting per endpoint.
- **User Management**: RBAC (Role-Based Access Control), profile viewing and modification, and secure Cloudinary-backed avatar uploads.

#### [x] Phase 2: Accounts & Categories
- **Accounts System**: Robust backend APIs for CRUD operations on Accounts, including complex logic for handling negative credit card balances and tracking account status.
- **Categories Structure**: Full CRUD implementation for user-defined Income and Expense categories, combined with read-only system-level default categories.
- **Seed Script Data**: An idempotent Prisma seed script to initialize essential System Categories and an initial admin account.
- **Frontend UI Interfaces**: Polished dynamic React form modals for both `Accounts` and `Categories`, fully integrated with `react-hook-form` and `zod` client-side validation.
- **Integration Tests**: Supertest integration suites verifying core backend security and logic constraints for Accounts and Categories.
- **API Documentation**: Detailed Swagger/OpenAPI documentation configured dynamically via JSDoc annotations.

#### [ ] Phase 3: Transactions Module
*(Pending Implementation)*

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

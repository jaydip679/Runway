# Runway

Runway — A production-grade personal finance forecasting platform that predicts future cash flow, detects recurring commitments, and helps users make proactive financial decisions with AI-powered insights.

## Project Status

**Current Phase Completed:** Phase 8 (GraphQL Dashboard API)

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

#### [x] Phase 3: Transactions & Imports
- **Transaction Engine**: Built a highly efficient CRUD system optimized with compound cursor pagination (`transactionDate`, `id`) for robust infinite-scrolling. 
- **Type Validation**: Enforced strict financial rules to prevent future-dated transactions and matching category types.
- **Receipts**: Added image upload integration for individual receipts via `multer`.
- **CSV Import System**: Constructed an asynchronous ingestion pipeline utilizing `BullMQ` and `Redis`. Users can upload large CSV files, and the background worker chunks and persists data while providing real-time polling updates.
- **Frontend UI Interfaces**: Implemented `@tanstack/react-query` powered data tables and form modals for robust UX.

#### [x] Phase 4: Recurring Commitments & Detection Engine
- **Detection Algorithm**: A powerful pure-function algorithm that analyzes trailing 90 days of transaction history to automatically spot recurring trends.
- **Background Scanner**: A daily `BullMQ` scheduled worker that evaluates groups and suppresses historically dismissed items.
- **Optimistic UI**: A React Query-powered frontend hub allowing users to confidently Confirm, Edit, or Dismiss predicted recurring expenses instantly.

#### [x] Phase 5: Forecast Engine
- **Projection Algorithm**: Developed a pure-function engine that calculates future cash flow trajectories based on confirmed transactions and detected recurring commitments.
- **Confidence Modeling**: Implemented high/medium/low confidence bracketing to help users visualize projection uncertainty.
- **Event Debouncing**: Integrated `BullMQ` debounce triggers to ensure forecasts recalculate only when relevant financial data changes, optimizing system resources.
- **Visualization**: Built interactive dashboards using `Recharts` to display 60-day cash flow predictions and balance trend lines.

#### [x] Phase 6: Alerts & Notifications
- **Notification Infrastructure**: Built an event-driven system to push alerts based on forecast anomalies and recurring schedule events.
- **Smart Alert Engine**: Logic to monitor for low balance thresholds, upcoming recurring renewals (3-day notice), and subscription price shifts.
- **Notification Hub**: Integrated a centralized read/unread UI notification center.
- **Idempotency**: Implemented unique alert keys to ensure the system does not spam users with duplicate notifications for the same event.

#### [x] Phase 7: AI Affordability Feature
- **Context-Aware Prompting**: Inject real-time 30-day forecast and recurring commitment data into a strict LLM prompt.
- **Provider Abstractions**: Interchangeable support for OpenAI and Gemini models, currently running on a mock instance for local testing.
- **Robust Guardrails**: Detailed tracking of all queries via `AiQueryLog` and strict 24-hour rate limiters (10/day) preventing abuse.
- **Chat UI**: Interactive assistant page to ask natural-language questions about financial health and view structured reasoning with confidence intervals.

#### [x] Phase 8: GraphQL Dashboard API
- **Unified Graph**: Mounted `graphql-http` at `/api/v1/graphql` combining Accounts, Forecasts, Alerts, and Recurring Commitments into a single schema.
- **Strict Composition**: The `dashboard` resolver delegates 100% of its data-fetching directly to existing REST service layers, ensuring zero duplicated business logic.
- **React Query & Axios**: The Dashboard UI consumes the entire graph in a single network request using standard `axios`, maintaining a tiny client footprint without Apollo.
- **Component Reuse**: Dashboard seamlessly embeds the existing `ForecastChart` and `AccountCard` UI elements, proving the GraphQL shape parity with REST.

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

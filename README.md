# 🚀 Runway — AI-Powered Financial Forecasting Platform

Runway is a production-grade personal finance platform that goes beyond traditional expense tracking by forecasting your future cash flow. It combines **AI-powered financial insights**, **recurring subscription detection**, **scenario planning**, and **predictive analytics** to help users make smarter financial decisions before they spend.

Built with **React, Node.js, Express, PostgreSQL, Prisma, Redis, BullMQ, Google Gemini AI, Docker, GitHub Actions, and Sentry**, Runway emphasizes scalable architecture, asynchronous processing, security, and production-grade engineering practices.

### 🔗 Links

- 🌐 **Live Demo:** https://runwayfinance.vercel.app
- 📖 **API Documentation (Swagger):** https://runway-api-ovev.onrender.com/api/docs
- 🐙 **GitHub Repository:** https://github.com/jaydip679/Runway

<img
  src="https://github.com/user-attachments/assets/3149dbbc-cc79-4e02-bd05-6770e9be6b98"
  alt="Runway Dashboard"
  width="100%"
/>

<br>

## 🛠️ Technology Stack

| Category | Technology |
|:---------|:-----------|
| 🎨 **Frontend** | React 18, Vite, Tailwind CSS, Recharts, React Router |
| ⚙️ **Backend** | Node.js 20, Express.js |
| 🔌 **API Layer** | REST, GraphQL |
| 🗄️ **Database** | PostgreSQL |
| 🔗 **ORM** | Prisma |
| 🔐 **Authentication** | JWT, Google OAuth 2.0 |
| 🚀 **Cache & Queue** | Redis, BullMQ |
| 🤖 **AI** | Google Gemini API |
| ☁️ **Storage** | Cloudinary |
| 📧 **Email** | Gmail SMTP |
| 📊 **Monitoring** | Sentry, Winston |
| 🐳 **DevOps** | Docker, Docker Compose, GitHub Actions |
| 🌍 **Deployment** | Vercel (Frontend), Render (Backend & Workers) |
| 🧪 **Testing** | Jest, Supertest |
| 📖 **API Documentation** | Swagger / OpenAPI |

<br>

## 🏗️ System Architecture

Runway follows a modular architecture that separates **client interaction**, **business logic**, **data persistence**, and **asynchronous processing**. The frontend communicates with the Node.js API through REST and a dedicated GraphQL endpoint used by the Dashboard, while Redis and BullMQ handle background workloads independently from the request-response cycle.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│                    React + Vite + Tailwind                          │
│                                                                     │
│       Dashboard • Accounts • Transactions • Forecast • AI           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    REST API / GraphQL
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                   │
│                                                                     │
│                       Node.js + Express                             │
│                                                                     │
│   Authentication • Validation • Controllers • Services • RBAC       │
│                                                                     │
│                 ┌──────────────────────────┐                        │
│                 │ GraphQL Dashboard Layer  │                        │
│                 │ Aggregates existing      │                        │
│                 │ service-layer operations │                        │
│                 └──────────────────────────┘                        │
└───────────────┬───────────────────────┬─────────────────────────────┘
                │                       │
                │                       │
                ▼                       ▼
┌─────────────────────────┐   ┌───────────────────────────────────────┐
│     DATA LAYER          │   │        ASYNC PROCESSING               │
│                         │   │                                       │
│ Prisma ORM              │   │ Redis                                 │
│         │               │   │         │                             │
│         ▼               │   │         ▼                             │
│ PostgreSQL              │   │ BullMQ Queues                         │
│                         │   │         │                             │
└─────────────────────────┘   │         ▼                             │
                              │ BullMQ Worker                         │
                              │                                       │
                              │ CSV • Forecast • PDF • Recurring      │
                              │ Email • Notifications • Scheduled Jobs│
                              └──────────────┬────────────────────────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                         ▼                   ▼                   ▼
                  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                  │ Cloudinary  │     │ Gmail SMTP  │     │   Gemini    │
                  │   Storage   │     │   Email     │     │     AI      │
                  └─────────────┘     └─────────────┘     └─────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY LAYER                             │
│                                                                     │
│              Sentry  +  Winston Structured Logging                  │
│                                                                     │
│          Frontend • API • Background Workers • Errors               │
└─────────────────────────────────────────────────────────────────────┘
```

<br>

## ✨ Project Highlights

- 🤖 **AI Financial Assistant:** Context-aware financial assistant powered by Google Gemini for personalized financial insights.

- 📈 **Predictive Forecast Engine:** Deterministic 60-day cash-flow forecasting with future balance projections.

- 🎯 **Scenario Planning:** Simulate hypothetical financial decisions and evaluate their long-term impact before spending.

- 📅 **Exact Date Evaluation:** Calculate projected balances for specific future dates to support important financial decisions.

- 🔄 **Smart Recurring Detection:** Automatically identifies recurring income and expenses from historical transaction patterns.

- ⚙️ **Background Processing:** BullMQ-powered workers handle resource-intensive operations asynchronously without blocking the API.

- 📄 **Reports & Data Export:** Asynchronous CSV ingestion and PDF report generation for financial data.

- 🔐 **Authentication & Security:** JWT authentication, Google OAuth, HttpOnly cookies, token rotation, RBAC, and Redis-backed rate limiting.

- 🔌 **Unified Dashboard API:** GraphQL aggregates accounts, forecasts, alerts, and recurring commitments into a single dashboard request.

- 🛰️ **Monitoring & Observability:** Full-stack error tracking through Sentry combined with structured Winston logging.

- 🐳 **Production-Ready Infrastructure:** Dockerized development environment with GitHub Actions CI/CD, Render, and Vercel.

- 📚 **Developer Experience:** Swagger/OpenAPI documentation, Prisma ORM, REST APIs, GraphQL, automated testing, and maintainable modular architecture.

<br>

## 🧭 Application Overview

Runway is organized into purpose-built modules, each designed to handle a specific aspect of personal finance management.

- **📊 Dashboard**  
  The central command center providing account balances, cash-flow forecasts, financial insights, recurring commitments, alerts, and recent activity.

- **🏦 Accounts**  
  Manage bank accounts, credit cards, wallets, and other financial accounts while tracking overall balances and net worth.

- **💸 Transactions**  
  Record, categorize, search, and manage financial transactions with support for receipt uploads and bulk CSV imports.

- **🗂️ Categories**  
  Organize income and expenses using system defaults and custom categories for structured financial tracking.

- **📈 Forecast**  
  Visualize projected cash flow over the next 60 days based on financial activity and recurring transactions.

- **📅 Exact Date Evaluation**  
  Estimate the projected balance on a specific future date to help plan upcoming financial commitments.

- **🎯 Scenario Planning**  
  Simulate future transactions and compare different financial scenarios before making real commitments.

- **📑 Reports**  
  Generate and download detailed PDF and CSV financial reports asynchronously.

- **🤖 AI Assistant**  
  Interact with a context-aware Google Gemini-powered assistant for personalized financial guidance.

- **🔔 Notifications**  
  Receive important alerts such as low-balance warnings, recurring payment reminders, and system notifications.

- **⚙️ Settings & Profile**  
  Manage profile information, preferences, security settings, avatars, and application configuration.

- **🛡️ Admin Dashboard**  
  A role-based operational dashboard for platform administrators to monitor users and oversee application operations.

<br>

## ⚙️ Engineering Deep Dives

Runway was built with a production-first mindset, emphasizing **scalability**, **maintainability**, and **operational reliability**. Every major component—from forecasting and AI to background workers and monitoring—was designed to solve real-world problems while keeping the application responsive, secure, and easy to operate in production.

---

### 📊 Dashboard Experience

The **Dashboard** serves as the central command center of Runway, bringing together **account balances**, **cash-flow forecasts**, **AI insights**, **recurring commitments**, and recent financial activity into a single actionable view. Instead of making multiple requests for each dashboard component, the frontend uses a dedicated **GraphQL aggregation endpoint** to retrieve the required data in a single request while reusing the existing backend service layer.


---

### 📈 Forecast Engine

The **Forecast Engine** is the core of Runway, continuously analyzing **confirmed transactions** together with **automatically detected recurring income and expenses** to generate a deterministic **60-day cash-flow forecast**. Forecast calculations are refreshed when underlying financial data changes, allowing users to see up-to-date projections while avoiding unnecessary repeated computation.

---

### 📅 Exact Date Evaluation

**Exact Date Evaluation** leverages the **Forecast Engine** to calculate the projected account balance on any future date, helping users confidently prepare for **tax payments**, **EMIs**, vacations, or other upcoming financial commitments. Instead of manually interpreting an entire forecast timeline, users can directly evaluate the financial position expected on the date that matters to them.

<img
  src="https://github.com/user-attachments/assets/971f7add-de52-4c94-9cb4-45091b6bda1b"
  alt="Exact Date Evaluation"
  width="100%"
/>

---

### 🎯 Scenario Planning

The **Scenario Planning** module allows users to simulate **future income or expenses** without modifying real financial data by temporarily injecting hypothetical transactions into the forecasting engine. This enables users to compare different financial scenarios and understand the long-term impact of major decisions before committing to them.

<img
  src="https://github.com/user-attachments/assets/d55105c6-d950-40e1-8f49-e789d440d844"
  alt="Scenario Planning"
  width="100%"
/>

---

### 🤖 Context-Aware AI Assistant

The **AI Assistant** combines **recent transactions**, **account balances**, **recurring commitments**, and **forecast data** with **Google Gemini** to generate personalized financial guidance instead of generic responses. Intelligent **rate limiting**, **query logging**, and a built-in **development mock mode** help keep the feature reliable, secure, and cost-efficient.

<img
  src="https://github.com/user-attachments/assets/d37ecb70-bd5d-430a-968a-8b154d0dd3a5"
  alt="AI Assistant"
  width="100%"
/>

---

### ⚙️ Background Processing

Resource-intensive operations are handled by dedicated **BullMQ background workers**, allowing **CSV imports**, **forecast generation**, **PDF reports**, **email delivery**, and **recurring transaction detection** to execute asynchronously. This architecture keeps the API responsive while allowing long-running tasks to be processed independently from the request-response lifecycle.

---

### 📄 Reports & Data Export

The **Reports** module generates professional **PDF** and **CSV** exports asynchronously, allowing users to download detailed financial summaries without blocking API requests. Generated reports are securely delivered to users and automatically cleaned up after a configurable retention period to optimize server resources.

<img
  src="https://github.com/user-attachments/assets/02f9e44d-f4f5-45ec-b9df-7b989edad204"
  alt="Reports"
  width="100%"
/>

---

### 🔐 Authentication & Security

Runway follows modern security practices by combining **JWT authentication**, **Google OAuth**, **HttpOnly secure cookies**, **Role-Based Access Control (RBAC)**, **Redis-backed rate limiting**, **Helmet security headers**, **OTP verification**, and **token rotation** to provide a secure authentication experience while protecting application resources.

---

### 📊 Monitoring & Observability

The platform includes comprehensive observability through **Sentry** and **Winston**, enabling **real-time error tracking**, **structured logging**, and **cross-service debugging** across the frontend, backend, and background workers. Sensitive information is sanitized before transmission so production diagnostics can remain useful without exposing credentials or authentication data.

---

### 🚀 CI/CD & Deployment

Runway is deployed through an automated **GitHub Actions CI/CD pipeline** with **Render** and **Vercel**, where every deployment validates the application, runs the test suite, synchronizes **Prisma database migrations**, and provisions the latest production release. Infrastructure is additionally defined through `render.yaml` to keep backend deployment configuration consistent and reproducible.

<br>

## 💻 Local Development

Runway can be started locally using **Docker Compose** for a complete environment, or individual Node.js processes for development without Docker.

### Prerequisites

- **Docker** & **Docker Compose**
- **Node.js 20+**

### 🐳 Docker Setup

The recommended approach starts the complete application stack, including **PostgreSQL**, **Redis**, **Express API**, **BullMQ Worker**, and **Nginx**.

```bash
docker-compose up -d
```

Once the containers are running, the application and its supporting services are available through the configured local ports.

### 🛠️ Manual Setup

For development without Docker, run the backend and frontend separately.

**Backend**

```bash
cd server
npm install
npx prisma migrate dev
npm run start:prod
```

The backend command starts the **Express API** and **BullMQ worker** processes.

**Frontend**

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

### 📖 API & Health Endpoints

Runway provides interactive API documentation and dedicated health endpoints for development and operational checks.

| Endpoint | Purpose |
|:---------|:--------|
| `GET /health` | Basic API liveness check |
| `GET /health/ready` | Verifies PostgreSQL and Redis availability |
| `/api/docs` | Interactive Swagger / OpenAPI documentation |

<br>

## 📄 License

Runway is distributed under the **MIT License**. See the [`LICENSE`](LICENSE) file for the complete license terms.

## 👨‍💻 Author

**Jaydip Chaudhari**

[GitHub](https://github.com/jaydip679) · [LinkedIn](https://linkedin.com/in/jaydip679)
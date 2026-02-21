<p align="center">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="80" alt="NestJS Logo" />
  </a>
</p>

<h1 align="center">IVU Shop — Backend</h1>

<p align="center">
  Multi-tenant SaaS backend for small businesses. Built on NestJS with JWT authentication, refresh token rotation, email verification, dual PostgreSQL databases and TypeORM.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v11-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TypeORM-0.3-FE0803?style=flat-square" alt="TypeORM" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## Features

- **Multi-tenant Architecture** — Tenant isolation with slug-based identification and business type classification
- **JWT Authentication** — Access token (Bearer) + Refresh token (httpOnly cookie)
- **Refresh Token Rotation** — New token pair on every refresh
- **Reuse Detection** — Invalidates all sessions when a stolen token is detected
- **Email Verification** — Account activation via email link
- **Forgot / Reset Password** — Secure token-based password recovery
- **Role-based Access Control** — `user` and `admin` roles with guards
- **Subscription & Plan Management** — Tenants linked to plans with trial/active/inactive lifecycle
- **Dual Database Setup** — `shared_db` for core entities, `operations_db` for business-vertical data
- **Database Migrations** — TypeORM migrations workflow for each database
- **Input Validation** — `class-validator` + `class-transformer` on all DTOs
- **Docker Compose** — Both PostgreSQL instances ready to run locally

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS v11 |
| Language | TypeScript 5.7 |
| Database | PostgreSQL 16 (×2) |
| ORM | TypeORM 0.3 |
| Auth | Passport.js + JWT |
| Email | Resend |
| Containerization | Docker + Docker Compose |

---

## Architecture — Dual Database

```
┌─────────────────────────────────┐   ┌──────────────────────────────────────┐
│         shared_db               │   │           operations_db              │
│         port 5433               │   │           port 5434                  │
├─────────────────────────────────┤   ├──────────────────────────────────────┤
│  users         (auth + tenantId)│   │  (business-vertical entities,        │
│  tenants       (slug, type)     │   │   configured per vertical:           │
│  plans         (price, limits)  │   │   bar, minimarket, auto parts, etc.) │
│  subscriptions (tenant ↔ plan)  │   │                                      │
└─────────────────────────────────┘   └──────────────────────────────────────┘
```

**Supported business types:** `bar`, `minimarket`, `auto_parts_shop`, `clothing_store`, `shoe_store`

**Subscription statuses:** `trial` → `active` / `inactive`

---

## Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the databases)
- A [Resend](https://resend.com/) account (free tier) for sending emails

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ivu-shop-backend.git
cd ivu-shop-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.template .env
```

Then open `.env` and fill in the values (see [Environment Variables](#environment-variables) below).

### 4. Start the databases

```bash
docker compose up -d
```

This starts two PostgreSQL instances:
- `shared_db` on port `5433`
- `operations_db` on port `5434`

### 5. Run database migrations

Migrations only target `shared_db`. `operations_db` is managed separately per business vertical.

```bash
npm run migration:run
```

### 6. Start the server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run start:prod
```

The API will be available at: `http://localhost:3001/api/v1`

---

## Environment Variables

### Shared DB (Docker + TypeORM)

| Variable | Description | Example |
|---|---|---|
| `SHARED_DB_HOST` | Host for shared_db | `localhost` |
| `SHARED_DB_PORT` | Host port for shared_db | `5433` |
| `SHARED_DB_USER` | PostgreSQL user (Docker) | `postgres` |
| `SHARED_DB_USERNAME` | App DB username (TypeORM) | `postgres` |
| `SHARED_DB_PASSWORD` | Database password | `secret` |
| `SHARED_DB_NAME` | Database name | `ivu_shared` |

### Operations DB (Docker + TypeORM)

| Variable | Description | Example |
|---|---|---|
| `OPERATIONS_DB_HOST` | Host for operations_db | `localhost` |
| `OPERATIONS_DB_PORT` | Host port for operations_db | `5434` |
| `OPERATIONS_DB_USER` | PostgreSQL user (Docker) | `postgres` |
| `OPERATIONS_DB_USERNAME` | App DB username (TypeORM) | `postgres` |
| `OPERATIONS_DB_PASSWORD` | Database password | `secret` |
| `OPERATIONS_DB_NAME` | Database name | `ivu_operations` |

### Auth & App

| Variable | Description | Example |
|---|---|---|
| `PORT` | App port | `3001` |
| `JWT_SECRET` | Secret for access tokens | `a-long-random-string` |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `another-long-random-string` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `FRONTEND_URL` | Frontend URL (for email links) | `http://localhost:3000` |
| `RESEND_API_KEY` | Resend API key | `re_xxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Sender email address | `no-reply@yourdomain.com` |

> **Tip:** Generate strong secrets with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

---

## API Endpoints

Base URL: `/api/v1`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register a new account |
| `GET` | `/auth/verify-email?token=` | — | Verify email address |
| `POST` | `/auth/login` | — | Login and get tokens |
| `POST` | `/auth/refresh` | Cookie | Rotate refresh token |
| `POST` | `/auth/forgot-password` | — | Request password reset email |
| `POST` | `/auth/reset-password` | — | Set new password |
| `POST` | `/auth/logout` | Bearer | Logout and clear session |

---

## Database Migrations

Migrations are scoped to `shared_db` via `src/database/data-source.ts`.

```bash
# Run all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Generate a new migration from entity changes
npm run migration:generate -- src/database/migrations/MigrationName
```

### Executed migrations

| Migration | Description |
|---|---|
| `1771561077050-CreateUsersTable` | Creates `users` table with auth fields |
| `1771646855376-AddMultiTenantSchema` | Creates `tenants`, `plans`, `subscriptions`; adds `tenantId` FK to `users` |

---

## Project Structure

```
src/
├── auth/
│   ├── dto/                  # Request validation schemas
│   ├── strategies/           # Passport JWT strategies
│   ├── types/                # JwtPayload interface
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── common/
│   ├── decorators/           # @CurrentUser, @Roles
│   ├── enums/                # Role, BusinessType, SubscriptionStatus
│   └── guards/               # JwtAuthGuard, RolesGuard
├── database/
│   ├── migrations/           # TypeORM migration files (shared_db)
│   └── data-source.ts        # Standalone DataSource for CLI (shared_db)
├── mail/
│   ├── templates/            # Email HTML templates
│   └── mail.service.ts       # Resend integration
├── plans/
│   └── entities/             # Plan entity
├── subscriptions/
│   └── entities/             # Subscription entity (Tenant ↔ Plan)
├── tenants/
│   └── entities/             # Tenant entity
├── users/
│   ├── dto/
│   ├── entities/             # User entity (with tenantId FK)
│   └── users.service.ts
├── app.module.ts             # Two TypeORM connections (shared + operations)
└── main.ts
```

---

## License

This project is [MIT licensed](LICENSE).

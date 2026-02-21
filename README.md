<p align="center">
  <a href="http://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="80" alt="NestJS Logo" />
  </a>
</p>

<h1 align="center">NestJS Backend Template</h1>

<p align="center">
  Production-ready NestJS starter with JWT authentication, refresh token rotation, email verification and PostgreSQL.
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

- **JWT Authentication** — Access token (Bearer) + Refresh token (httpOnly cookie)
- **Refresh Token Rotation** — New token pair on every refresh
- **Reuse Detection** — Invalidates all sessions when a stolen token is detected
- **Email Verification** — Account activation via email link
- **Forgot / Reset Password** — Secure token-based password recovery
- **Role-based Access Control** — `user` and `admin` roles with guards
- **Database Migrations** — TypeORM migrations workflow ready
- **Input Validation** — `class-validator` + `class-transformer` on all DTOs
- **Docker Compose** — PostgreSQL database ready to run locally

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS v11 |
| Language | TypeScript 5.7 |
| Database | PostgreSQL 16 |
| ORM | TypeORM 0.3 |
| Auth | Passport.js + JWT |
| Email | Resend |
| Containerization | Docker + Docker Compose |

---

## Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the database)
- A [Resend](https://resend.com/) account (free tier) for sending emails

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/andresdev-nest-backend-template.git
cd andresdev-nest-backend-template
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.template .env
```

Then open `.env` and fill in the values (see [Environment Variables](#environment-variables) section below).

### 4. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL instance on port `5434`.

### 5. Run database migrations

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

The API will be available at: `http://localhost:3000/api/v1`

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `POSTGRES_USER` | PostgreSQL superuser | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `secret` |
| `POSTGRES_DB` | PostgreSQL database name | `myapp` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5434` |
| `DB_USERNAME` | App DB username | `postgres` |
| `DB_PASSWORD` | App DB password | `secret` |
| `DB_NAME` | App DB name | `myapp` |
| `JWT_SECRET` | Secret for access tokens | `a-long-random-string` |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `another-long-random-string` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `FRONTEND_URL` | Your frontend URL (for email links) | `http://localhost:3000` |
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

```bash
# Run all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Generate a new migration from entity changes
npm run migration:generate -- src/database/migrations/MigrationName
```

---

## Project Structure

```
src/
├── auth/
│   ├── dto/                  # Request validation schemas
│   ├── strategies/           # Passport JWT strategies
│   ├── types/                # JwtPayload interface
│   ├── auth.controller.ts    # Auth endpoints
│   ├── auth.module.ts
│   └── auth.service.ts       # Auth business logic
├── common/
│   ├── decorators/           # @CurrentUser, @Roles
│   ├── enums/                # Role enum
│   └── guards/               # JwtAuthGuard, RolesGuard
├── database/
│   ├── migrations/           # TypeORM migration files
│   └── data-source.ts        # Standalone DataSource for CLI
├── mail/
│   ├── templates/            # Email HTML templates
│   └── mail.service.ts       # Resend integration
├── users/
│   ├── dto/
│   ├── entities/             # User entity
│   └── users.service.ts
├── app.module.ts
└── main.ts
```

---

## License

This project is [MIT licensed](LICENSE).

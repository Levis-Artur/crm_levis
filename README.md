# CRM / ERP Lite Monorepo Foundation

Initial production-oriented monorepo scaffold for a CRM/ERP-lite platform focused on sales, returns, manager finances, admin finances, and later Nova Poshta integration.

This step intentionally includes only the project foundation:

- monorepo/workspace setup
- Next.js frontend shell
- NestJS backend shell
- Prisma schema, migration scaffold, and seed support
- Dockerized MySQL and Redis infrastructure
- shared TypeScript, ESLint, and Prettier configuration

It does not include business modules, auth, or mock CRM logic yet.

## Stack

- Frontend: Next.js App Router + TypeScript
- Backend: NestJS + TypeScript
- Database: MySQL
- ORM: Prisma
- Cache/Queue: Redis
- UI: shadcn/ui ready base
- Tables: TanStack Table (reserved for feature modules)
- Forms: React Hook Form + Zod (reserved for feature modules)
- Charts: Recharts (reserved for feature modules)
- Auth: JWT + refresh tokens (reserved for next step)
- API style: REST
- Infra: Docker + Docker Compose

## Monorepo Structure

```text
.
|-- apps
|   |-- api
|   `-- web
|-- docs
|-- infra
|-- docker-compose.yml
`-- package.json
```

## Prerequisites

- Node.js 20.18+ or 22+ LTS (`.nvmrc` pins 22)
- npm 10+
- Docker Desktop / Docker Engine with Compose

## Local Setup

### 1. Create local environment files

PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\web\.env.example apps\web\.env.local
```

### 2. Install workspace dependencies

```powershell
npm install
```

### 3. Start infrastructure only

```powershell
docker compose up -d mysql redis
```

### 4. Run the applications locally

Single command from the repo root:

```powershell
npm run dev
```

Or run them separately:

```powershell
npm run dev --workspace apps/api
npm run dev --workspace apps/web
```

### 5. Prepare the database schema

```powershell
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
```

## Docker Commands

Start infrastructure:

```powershell
docker compose up -d mysql redis
```

Stop everything:

```powershell
docker compose down
```

Run infra plus placeholder app containers:

```powershell
docker compose --profile app up --build
```

## Production Deployment

### Production environment file

```powershell
Copy-Item .env.production.example .env.production
```

Set at minimum:

```env
MYSQL_DATABASE=crm
MYSQL_USER=crm_user
MYSQL_PASSWORD=change-me
MYSQL_ROOT_PASSWORD=change-me-too
CORS_ORIGIN=https://crm.example.com
NEXT_PUBLIC_API_URL=https://crm.example.com/api
NEXT_PUBLIC_APP_NAME=CRM ERP Lite
JWT_ACCESS_SECRET=replace-with-a-long-random-string
JWT_REFRESH_SECRET=replace-with-a-different-long-random-string
```

### Build and start on a VPS

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

### Prisma production migration

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm api npm run prisma:migrate:deploy --workspace apps/api
```

The `api` service also runs `prisma migrate deploy` on startup before launching the compiled Nest build.

### Logs

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f nginx
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f api
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f web
```

### Stop production stack

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

### Optional manual seed

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm api npm run prisma:seed --workspace apps/api
```

### First VPS deploy checklist

1. Install Docker Engine and Docker Compose plugin.
2. Copy the project to the VPS.
3. Copy `.env.production.example` to `.env.production` and set real secrets and domain values.
4. Open ports `80` and `443` on the VPS firewall.
5. Run Prisma migrations.
6. Start the stack with `docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build`.
7. Point the domain to the VPS IP.
8. Add TLS on top of the provided Nginx reverse proxy config.

## Useful Workspace Commands

```powershell
npm run lint
npm run typecheck
npm run build
npm run format
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
```

## Environment Variables

### Root `.env`

Used mainly by Docker Compose.

```env
MYSQL_DATABASE=crm
MYSQL_USER=crm_user
MYSQL_PASSWORD=crm_password
MYSQL_ROOT_PASSWORD=root_password
MYSQL_PORT=3306
REDIS_PORT=6379
WEB_PORT=3000
API_PORT=3001
JWT_ACCESS_SECRET=replace-with-a-long-random-string
JWT_REFRESH_SECRET=replace-with-a-different-long-random-string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_SALT_ROUNDS=12
NOVA_POSHTA_ENABLED=false
NOVA_POSHTA_BASE_URL=https://api.novaposhta.ua/v2.0/json/
NOVA_POSHTA_REQUEST_TIMEOUT_MS=10000
NOVA_POSHTA_API_KEY=
NOVA_POSHTA_SENDER_NAME=
NOVA_POSHTA_SENDER_REF=
NOVA_POSHTA_SENDER_CITY_REF=
NOVA_POSHTA_SENDER_WAREHOUSE_REF=
NOVA_POSHTA_SENDER_CONTACT_REF=
NOVA_POSHTA_SENDER_PHONE=
NOVA_POSHTA_DEFAULT_SERVICE_TYPE=WarehouseWarehouse
NOVA_POSHTA_DEFAULT_PAYER_TYPE=Recipient
NOVA_POSHTA_DEFAULT_PAYMENT_METHOD=Cash
NOVA_POSHTA_DEFAULT_CARGO_TYPE=Cargo
NOVA_POSHTA_DEFAULT_WEIGHT=1
NOVA_POSHTA_DEFAULT_SEATS_AMOUNT=1
```

### `apps/api/.env`

```env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=mysql://crm_user:crm_password@localhost:3306/crm
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=replace-with-a-long-random-string
JWT_REFRESH_SECRET=replace-with-a-different-long-random-string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_SALT_ROUNDS=12
NOVA_POSHTA_ENABLED=false
NOVA_POSHTA_BASE_URL=https://api.novaposhta.ua/v2.0/json/
NOVA_POSHTA_REQUEST_TIMEOUT_MS=10000
NOVA_POSHTA_API_KEY=
NOVA_POSHTA_SENDER_NAME=
NOVA_POSHTA_SENDER_REF=
NOVA_POSHTA_SENDER_CITY_REF=
NOVA_POSHTA_SENDER_WAREHOUSE_REF=
NOVA_POSHTA_SENDER_CONTACT_REF=
NOVA_POSHTA_SENDER_PHONE=
NOVA_POSHTA_DEFAULT_SERVICE_TYPE=WarehouseWarehouse
NOVA_POSHTA_DEFAULT_PAYER_TYPE=Recipient
NOVA_POSHTA_DEFAULT_PAYMENT_METHOD=Cash
NOVA_POSHTA_DEFAULT_CARGO_TYPE=Cargo
NOVA_POSHTA_DEFAULT_WEIGHT=1
NOVA_POSHTA_DEFAULT_SEATS_AMOUNT=1
```

### `apps/web/.env.local`

```env
API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=CRM ERP Lite
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Architectural Notes

- npm workspaces keep the monorepo simple and reduce tooling overhead at the foundation stage.
- The web app is App Router based and already prepared for shadcn/ui conventions.
- The API is modular from day one, with config and modules separated so domain modules can be added cleanly.
- Prisma is configured inside `apps/api` with a schema that covers the initial CRM backbone and seedable reference data.
- Docker Compose starts MySQL and Redis immediately, while `web` and `api` services stay as placeholders behind the `app` profile.

## Next Recommended Step

Implement NestJS data access and domain modules on top of the Prisma schema before building frontend workflows.

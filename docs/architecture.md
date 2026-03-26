# Architecture Foundation

## Intent

This repository starts as a lean monorepo foundation, not a feature prototype. The goal is to keep early decisions compatible with future growth in sales, returns, finance, and logistics domains.

## Layout

```text
apps/
  web/   Next.js App Router client application
  api/   NestJS REST API
docs/    Architecture and operating notes
infra/   Docker-related placeholders and future container config
```

## Backend Direction

- `apps/api/src/modules` is reserved for domain modules such as sales, returns, catalog, finance, and logistics.
- `apps/api/src/config` centralizes environment validation and later application configuration.
- `AppModule` only wires global infrastructure and non-business modules.

## Frontend Direction

- `apps/web/src/app` owns route composition.
- `apps/web/src/components` should be used later for reusable UI primitives and domain layout blocks.
- `apps/web/src/features` can be introduced once business modules start landing.
- `components.json` and `cn()` are already in place so shadcn/ui can be added without refactoring the base app.

## Deferred By Design

- Authentication and authorization
- Queue jobs and Redis consumers
- CRM business flows
- External logistics integrations

The Prisma schema now exists as the database contract. The remaining items are deliberately postponed until the domain services and workflows are agreed.

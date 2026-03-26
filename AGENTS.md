# AGENTS.md

## Project type
This is a production-oriented CRM/ERP-lite system for:
- sales management
- returns management
- manager finance tracking
- admin finance tracking
- future Nova Poshta integration
- future GPT assistant integration

## Fixed tech stack
- Frontend: Next.js (App Router) + TypeScript
- Backend: NestJS + TypeScript
- Database: MySQL
- ORM: Prisma
- Cache/Queue: Redis
- UI: shadcn/ui
- Tables: TanStack Table
- Forms: React Hook Form + Zod
- Charts: Recharts
- Auth: JWT + refresh tokens
- API style: REST
- Infra: Docker + docker-compose

## Repository structure
- apps/web — Next.js frontend
- apps/api — NestJS backend
- infra — docker and infrastructure files
- docs — technical docs

## Architecture rules
1. Do not turn this into a demo app.
2. Do not merge frontend and backend into one app.
3. Keep code modular and production-oriented.
4. Do not invent business rules that were not explicitly defined.
5. Do not hardcode secrets.
6. Do not use mock data unless explicitly requested.
7. Always respect role-based access control.
8. Backend business logic must live in backend services, not in frontend.
9. Validation is mandatory for DTOs/forms.
10. Prisma schema changes must preserve current business logic.

## Backend rules
1. Use NestJS modules, controllers, services, DTOs, guards, decorators.
2. Use Prisma for DB access.
3. Keep endpoints RESTful.
4. Add audit logging for critical actions.
5. Protect private endpoints with JWT auth.
6. Enforce admin/manager permissions correctly.
7. Do not bypass validation.
8. Do not place business logic inside controllers.

## Frontend rules
1. Use App Router.
2. Keep UI responsive and mobile-friendly.
3. Use shadcn/ui components where appropriate.
4. Use TanStack Table for data tables.
5. Use React Hook Form + Zod for forms.
6. Keep design clean, business-oriented, and practical.
7. Prefer feature-based folder structure for complex modules.
8. Do not create fake CRM screens beyond requested scope.

## Business rules that must not be broken
1. Manager earnings = margin * 0.3
2. Available to withdraw = earnings from fully completed orders minus already paid payouts
3. Returns are separate from active sales flow
4. Orders moved to returns must no longer behave as active normal sales
5. Order status transitions must follow the allowed transition map
6. Admin can see all orders
7. Manager can see only own orders unless explicitly changed
8. Finance, orders, and returns are separate business entities

## Naming and consistency
1. Keep naming consistent across DTOs, Prisma, services, and UI.
2. Avoid naming drift like comment vs notes for the same field.
3. Prefer explicit names over vague names.
4. Use OrderReturn instead of Return.

## Scope control
For each task:
1. Only implement the requested scope.
2. Do not pre-implement future modules.
3. After finishing, stop and summarize:
   - what was changed
   - which files were added/updated
   - how to run/test
   - what remains next

## Output style
Be concise, technical, and explicit.
Do not produce long marketing-style explanations.
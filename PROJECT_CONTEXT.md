# PROJECT_CONTEXT.md

## Current project state

This CRM/ERP-lite project already has:

### Foundation
- monorepo structure
- apps/web
- apps/api
- infra
- docs
- docker-compose with MySQL and Redis
- env validation
- workspace setup

### Database / Prisma
Implemented Prisma schema with core entities:
- Role
- User
- Order
- OrderItem
- OrderStatus
- PaymentStatus
- DeliveryStatus
- OrderReturn
- ReturnStatus
- FinanceCategory
- FinanceTransaction
- ManagerPayout
- Shipment
- AuditLog
- Comment

Seed data exists for:
- roles
- statuses
- finance categories

### Auth backend
Implemented:
- auth module
- users module
- roles-based access
- JWT auth
- refresh token flow
- admin-only user management
- pagination on users list

### Frontend foundation
Implemented:
- login page
- protected layout
- dashboard shell
- sidebar
- header
- mobile navigation
- auth integration
- route protection

### Orders backend
Implemented:
- GET /orders
- POST /orders
- GET /orders/:id
- PATCH /orders/:id
- PATCH /orders/:id/status
- pagination
- search
- filters
- permission rules
- backend margin calculations
- audit logs
- status transition validation

### Orders frontend
Implemented:
- orders list
- create order page
- order details page
- edit order page
- filters
- search
- pagination
- API integration
- responsive layout

## Important established decisions
1. Tech stack is fixed.
2. Database is MySQL with Prisma.
3. Returns are a separate module and lifecycle.
4. Finance logic must stay on the backend.
5. Manager reward is 30 percent of margin.
6. This is not a demo project.

## Known cleanup items
1. UI text should gradually be localized to Ukrainian.
2. Naming consistency should be preserved across backend/frontend.
3. Avoid duplication like salePrice + unitPrice unless justified.

## Next likely modules
- Returns backend/frontend
- Finance backend/frontend
- Dashboards
- References/settings
- Nova Poshta integration
- GPT assistant
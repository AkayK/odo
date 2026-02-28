# Ticket Management System (Is Istem Yonetim Sistemi)

## Tech Stack
- **Frontend**: React (Vite + React Router)
- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Auth**: JWT (jsonwebtoken + bcryptjs)

## Project Structure
```
odo/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and env config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, role-guard, validation
│   │   ├── models/          # Database query functions
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Helpers (logger, errors)
│   │   └── seeds/           # Seed data scripts
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Shared UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── context/         # React context (auth)
│   │   ├── services/        # API client functions
│   │   └── utils/           # Helpers, constants
│   └── package.json
├── docs/
│   └── er-diagram.png       # ER diagram (required)
├── CLAUDE.md
└── README.md
```

## Database Schema

### Tables
1. **roles** - id, name (admin/manager/worker), description
2. **departments** - id, name (IT/HR/Finance/Operations/General), description
3. **users** - id, email, password_hash, first_name, last_name, role_id (FK), department_id (FK), is_active, created_at, updated_at
4. **categories** - id, name, description, department_id (FK), is_active, created_at
5. **tickets** - id, title, description, category_id (FK), priority (enum), status (enum), created_by (FK users), assigned_to (FK users), department_id (FK), created_at, updated_at
6. **ticket_history** - id, ticket_id (FK), changed_by (FK users), field_changed, old_value, new_value, created_at

### Enums
- **priority**: low, medium, high, critical
- **status**: open, in_progress, on_hold, closed
- **role**: admin, manager, worker

## Roles & Permissions

| Action                     | Admin | Manager | Worker |
|---------------------------|-------|---------|--------|
| Create users              | Y     | N       | N      |
| Assign roles              | Y     | N       | N      |
| Manage categories         | Y     | N       | N      |
| View all tickets          | Y     | N       | N      |
| View department tickets   | Y     | Y       | N      |
| Create tickets            | Y     | Y       | Y      |
| Update ticket status      | Y     | Y       | Y*     |
| Change priority           | Y     | Y       | N      |
| Close tickets             | Y     | Y       | N      |
| Assign tickets            | Y     | Y       | N      |

*Worker can update status only on tickets they created or are assigned to.

## Implementation Phases

### Phase 1: Authentication & Authorization (CURRENT)
- [x] Project scaffolding (backend + frontend)
- [x] MySQL database + tables (users, roles, departments)
- [x] JWT login endpoint (POST /api/auth/login)
- [x] GET /api/auth/me - current user info
- [x] Auth middleware (verifyToken)
- [x] Role-guard middleware (requireRole)
- [x] Seed 3 test users
- [x] React login page
- [x] Auth context + protected routes
- [x] Role-based dashboard stub

### Phase 2: User Management (Admin)
- [x] GET /api/users - list users (admin only)
- [x] POST /api/users - create user (admin only)
- [x] PUT /api/users/:id - update user (admin only)
- [x] DELETE /api/users/:id - deactivate user (admin only)
- [x] Admin user management page
- [x] Role assignment UI

### Phase 3: Category Management
- [ ] CRUD /api/categories (admin only)
- [ ] Category-department linking
- [ ] Admin category management page

### Phase 4: Ticket CRUD
- [ ] POST /api/tickets - create ticket
- [ ] GET /api/tickets - list tickets (role-filtered)
- [ ] GET /api/tickets/:id - ticket detail
- [ ] PUT /api/tickets/:id - update ticket
- [ ] Ticket status transition validation (open->in_progress->on_hold->closed)
- [ ] Ticket history logging
- [ ] Frontend: ticket list, detail, create form

### Phase 5: Ticket Workflow
- [ ] Ticket assignment (manager assigns to self or worker)
- [ ] Priority update (manager/admin only)
- [ ] Status change with history tracking
- [ ] Reopen closed tickets (optional)
- [ ] Department-filtered views for managers

### Phase 6: Dashboard & Polish
- [ ] Role-based dashboard with stats
- [ ] Ticket filtering/sorting
- [ ] ER diagram generation
- [ ] README documentation
- [ ] Final cleanup and testing

## API Endpoints

### Auth
- `POST /api/auth/login` - Login with email/password, returns JWT
- `GET /api/auth/me` - Get current user (requires token)

### Users (Phase 2)
- `GET /api/users` - List users (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Deactivate user (admin)

### Categories (Phase 3)
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Deactivate category (admin)

### Tickets (Phase 4-5)
- `GET /api/tickets` - List tickets (role-filtered)
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/:id` - Get ticket detail
- `PUT /api/tickets/:id` - Update ticket
- `PUT /api/tickets/:id/status` - Change status
- `PUT /api/tickets/:id/assign` - Assign ticket (manager/admin)
- `GET /api/tickets/:id/history` - Get ticket history

## Test Users

| Role       | Email                  | Password     |
|-----------|------------------------|-------------|
| Admin      | admin@ticketsys.com    | Admin123!   |
| IT Manager | manager@ticketsys.com  | Manager123! |
| IT Worker  | worker@ticketsys.com   | Worker123!  |

## Git Workflow
- Conventional commits: feat:, fix:, refactor:, docs:, chore:
- Small, logical commits per feature
- Feature branches when applicable

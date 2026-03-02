# Ticket Management System (Is Istem Yonetim Sistemi)

A role-based ticket management system where users can create, track, and resolve work requests across departments.

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **Auth:** JWT

## Prerequisites

- Node.js (v18+)
- MySQL (v8+)

## Setup

### 1. Database

```bash
mysql -u root < database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # edit DB credentials if needed
npm install
npm run seed:all       # seeds departments, categories, users, and sample tickets
npm run dev            # starts on http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev   # starts on http://localhost:5173
```

## Test Users

| Role            | Email                        | Password     | Department       |
|----------------|------------------------------|-------------|------------------|
| Admin           | admin@ticketsys.com          | Admin123!   | —                |
| IT Manager      | it.manager@ticketsys.com     | Manager123! | IT               |
| IT Worker 1     | it.worker1@ticketsys.com     | Worker123!  | IT               |
| IT Worker 2     | it.worker2@ticketsys.com     | Worker123!  | IT               |
| HR Manager      | hr.manager@ticketsys.com     | Manager123! | HR               |
| HR Worker       | hr.worker1@ticketsys.com     | Worker123!  | HR               |
| Finance Manager | fin.manager@ticketsys.com    | Manager123! | Finance          |
| Finance Worker  | fin.worker1@ticketsys.com    | Worker123!  | Finance          |
| Ops Manager     | ops.manager@ticketsys.com    | Manager123! | Operations       |
| Ops Worker      | ops.worker1@ticketsys.com    | Worker123!  | Operations       |
| Mkt Manager     | mkt.manager@ticketsys.com    | Manager123! | Marketing        |
| Mkt Worker      | mkt.worker1@ticketsys.com    | Worker123!  | Marketing        |
| CS Manager      | cs.manager@ticketsys.com     | Manager123! | Customer Support |
| CS Worker       | cs.worker1@ticketsys.com     | Worker123!  | Customer Support |

Legacy aliases: `manager@ticketsys.com` / `worker@ticketsys.com` (both IT dept)

## Environment Variables

Create `backend/.env`:

```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ticket_system
JWT_SECRET=<your-secret>
JWT_EXPIRES_IN=24h
```

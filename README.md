# Finance Dashboard Backend

A REST API backend for a finance dashboard system built with **Node.js**, **Express**, and **PostgreSQL**.

---

## Tech Stack

| Layer       | Choice                   |
|-------------|--------------------------|
| Runtime     | Node.js                  |
| Framework   | Express.js               |
| Database    | PostgreSQL                |
| Auth        | JWT (jsonwebtoken)        |
| Passwords   | bcryptjs                 |
| Validation  | express-validator         |

---

## Project Structure

```
src/
├── config/
│   ├── db.js          # PostgreSQL connection pool
│   └── schema.sql     # Database schema + seed data
├── middleware/
│   ├── auth.js        # JWT authentication middleware
│   └── rbac.js        # Role-based access control
├── controllers/
│   ├── authController.js      # Login, Register, Me
│   ├── userController.js      # Admin: CRUD for users
│   ├── recordController.js    # Financial records CRUD
│   └── dashboardController.js # Analytics & summaries
├── routes/
│   ├── auth.js        # /api/auth/*
│   ├── users.js       # /api/users/*
│   ├── records.js     # /api/records/*
│   └── dashboard.js   # /api/dashboard/*
├── validators/
│   └── index.js       # All input validators
└── app.js             # Express entry point
```

---

## Roles & Permissions

| Action                        | Viewer | Analyst | Admin |
|-------------------------------|--------|---------|-------|
| Login / Register              | ✅     | ✅      | ✅    |
| View financial records        | ✅     | ✅      | ✅    |
| View recent activity          | ✅     | ✅      | ✅    |
| View dashboard summary        | ❌     | ✅      | ✅    |
| View category totals          | ❌     | ✅      | ✅    |
| View monthly/weekly trends    | ❌     | ✅      | ✅    |
| Create financial records      | ❌     | ❌      | ✅    |
| Update financial records      | ❌     | ❌      | ✅    |
| Delete financial records      | ❌     | ❌      | ✅    |
| Manage users (CRUD)           | ❌     | ❌      | ✅    |

---

## Setup Instructions

### 1. Clone and install
```bash
git clone <repo-url>
cd finance-dashboard
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret
```

### 3. Create PostgreSQL database
```sql
CREATE DATABASE finance_dashboard;
```

### 4. Run the schema
```bash
psql -U postgres -d finance_dashboard -f src/config/schema.sql
```

### 5. Seed the database (recommended)
```bash
npm run seed
```
Creates **3 users** and ~200 records across the last 12 months so all dashboard endpoints return real data immediately.

| Role    | Email             | Password  |
|---------|-------------------|-----------|
| admin   | admin@finance.com | Admin@123 |
| analyst | alice@finance.com | Alice@123 |
| viewer  | bob@finance.com   | Bob@123   |

### 6. Start the server
```bash
npm run dev   # development with auto-reload
npm start     # production
```

Server runs on `http://localhost:5000`

---

## Testing with Postman

Import `Finance_Dashboard.postman_collection.json` into Postman.

1. Run **Login (Admin)** — the token is **saved automatically** via a test script into `{{token}}`
2. All other requests pick up `{{token}}` from the Authorization header automatically
3. Switch roles by running **Login (Analyst)** or **Login (Viewer)** — the token updates instantly
4. Use the **❌ Access Control Tests** folder to verify RBAC returns correct 401/403 responses

---

## API Reference

### Auth

| Method | Endpoint              | Access | Description         |
|--------|-----------------------|--------|---------------------|
| POST   | `/api/auth/register`  | Public | Register new user   |
| POST   | `/api/auth/login`     | Public | Login, get JWT      |
| GET    | `/api/auth/me`        | Any    | Get current user    |

**Register body:**
```json
{ "name": "John", "email": "john@test.com", "password": "secret123" }
```

**Login body:**
```json
{ "email": "john@test.com", "password": "secret123" }
```

---

### Users (Admin only)

| Method | Endpoint         | Description               |
|--------|------------------|---------------------------|
| GET    | `/api/users`     | List users (paginated)    |
| GET    | `/api/users/:id` | Get user by ID            |
| POST   | `/api/users`     | Create user with role     |
| PUT    | `/api/users/:id` | Update name/role/status   |
| DELETE | `/api/users/:id` | Delete user               |

**Query params for GET /api/users:** `status`, `role`, `page`, `limit`

**Create user body:**
```json
{ "name": "Alice", "email": "alice@test.com", "password": "pass123", "role": "analyst" }
```

**Update user body (all optional):**
```json
{ "name": "Alice B", "role": "admin", "status": "inactive" }
```

---

### Financial Records

| Method | Endpoint            | Access  | Description              |
|--------|---------------------|---------|--------------------------|
| GET    | `/api/records`      | Viewer+ | List records (paginated) |
| GET    | `/api/records/:id`  | Viewer+ | Get single record        |
| POST   | `/api/records`      | Admin   | Create record            |
| PUT    | `/api/records/:id`  | Admin   | Update record            |
| DELETE | `/api/records/:id`  | Admin   | Soft delete record       |

**Query params for GET /api/records:** `type`, `category`, `date_from`, `date_to`, `page`, `limit`

**Create record body:**
```json
{
  "amount": 5000.00,
  "type": "income",
  "category": "Salary",
  "date": "2024-01-15",
  "notes": "January salary"
}
```

---

### Dashboard

| Method | Endpoint                         | Access  | Description             |
|--------|----------------------------------|---------|-------------------------|
| GET    | `/api/dashboard/recent`          | Viewer+ | Last N transactions     |
| GET    | `/api/dashboard/summary`         | Analyst+| Income, expense, net    |
| GET    | `/api/dashboard/category-totals` | Analyst+| Totals by category      |
| GET    | `/api/dashboard/monthly-trends`  | Analyst+| Monthly trends          |
| GET    | `/api/dashboard/weekly-trends`   | Analyst+| Weekly trends           |

**Query params:**
- `/summary`: `date_from`, `date_to`
- `/category-totals`: `type`, `date_from`, `date_to`
- `/monthly-trends`: `months` (default 12, max 24)
- `/weekly-trends`: `weeks` (default 8, max 52)
- `/recent`: `limit` (default 10, max 50)

---

## Authentication

All protected routes require a Bearer token:
```
Authorization: Bearer <your_jwt_token>
```

---

## Error Response Format

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

Validation errors:
```json
{
  "success": false,
  "errors": [
    { "field": "email", "msg": "Invalid email address." }
  ]
}
```

---

## Assumptions Made

1. **Self-registration** gives `viewer` role by default; admins must upgrade roles.
2. **Soft delete** is used for financial records (sets `deleted_at`); hard delete is used for users.
3. **Amounts** must always be positive; type (`income`/`expense`) determines the sign in calculations.
4. **Pagination** defaults to 10 items per page for all list endpoints.
5. **JWT expiry** is set to 7 days by default (configurable via `JWT_EXPIRES_IN`).
6. An admin **cannot deactivate or delete themselves** to prevent lockout.

---

## Features Implemented

- ✅ JWT authentication
- ✅ Role-based access control (viewer / analyst / admin)
- ✅ Full CRUD for financial records
- ✅ Full CRUD for user management
- ✅ Soft delete for records
- ✅ Pagination on all list endpoints
- ✅ Filtering by type, category, date range
- ✅ Dashboard: summary, category totals, monthly & weekly trends, recent activity
- ✅ Input validation with descriptive errors
- ✅ Global error handler
- ✅ Request logger

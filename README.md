# Finance Dashboard Backend

A REST API backend for a finance dashboard system built with **Node.js**, **Express**, and **MongoDB**.

---

## Tech Stack

| Layer      | Choice             |
|------------|--------------------|
| Runtime    | Node.js            |
| Framework  | Express.js         |
| Database   | MongoDB Atlas      |
| ODM        | Mongoose           |
| Auth       | JWT (jsonwebtoken) |
| Passwords  | bcryptjs           |
| Validation | express-validator  |

---

## Project Structure

```
finance-dashboard/
├── src/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection (Mongoose)
│   │   └── seed.js                # Seed script — creates users + records
│   ├── models/
│   │   ├── User.js                # User schema (role, status)
│   │   └── FinancialRecord.js     # Financial record schema (soft delete)
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication middleware
│   │   └── rbac.js                # Role-based access control
│   ├── controllers/
│   │   ├── authController.js      # Register, Login, Me
│   │   ├── userController.js      # Admin: CRUD for users
│   │   ├── recordController.js    # Financial records CRUD
│   │   └── dashboardController.js # Analytics & summaries
│   ├── routes/
│   │   ├── auth.js                # /api/auth/*
│   │   ├── users.js               # /api/users/*
│   │   ├── records.js             # /api/records/*
│   │   └── dashboard.js           # /api/dashboard/*
│   ├── validators/
│   │   └── index.js               # All input validation rules
│   └── app.js                     # Express entry point
├── .env.example
├── .gitignore
└── package.json
```

---

## Roles & Permissions

| Action                     | Viewer | Analyst | Admin |
|----------------------------|--------|---------|-------|
| Register / Login           | ✅     | ✅      | ✅    |
| View financial records     | ✅     | ✅      | ✅    |
| View recent activity       | ✅     | ✅      | ✅    |
| View dashboard summary     | ❌     | ✅      | ✅    |
| View category totals       | ❌     | ✅      | ✅    |
| View monthly/weekly trends | ❌     | ✅      | ✅    |
| Create financial records   | ❌     | ❌      | ✅    |
| Update financial records   | ❌     | ❌      | ✅    |
| Delete financial records   | ❌     | ❌      | ✅    |
| Manage users (CRUD)        | ❌     | ❌      | ✅    |

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
```

Edit `.env` with your values:
```env
PORT=5000
NODE_ENV=development
MONGO_URL=your mongo connection string
JWT_SECRET=your_super_secret_key_make_it_long
JWT_EXPIRES_IN=7d
```

> Get `MONGO_URI` from [mongodb.com](https://mongodb.com) → your cluster → **Connect** → **Drivers**

### 3. Seed the database
```bash
npm run seed
```

Creates 3 users and ~200 financial records spread across the last 12 months.

| Role    | Email             | Password  |
|---------|-------------------|-----------|
| admin   | admin@finance.com | Admin@123 |
| analyst | alice@finance.com | Alice@123 |
| viewer  | bob@finance.com   | Bob@123   |

### 4. Start the server
```bash
npm run dev    # development with auto-reload
npm start      # production
```

Server runs on `http://localhost:5000`

---

## API Reference

### Health Check
```
GET /health
```
```json
{ "status": "ok", "timestamp": "2024-01-15T10:30:00.000Z" }
```

---

### Auth

| Method | Endpoint             | Access | Description       |
|--------|----------------------|--------|-------------------|
| POST   | `/api/auth/register` | Public | Register new user |
| POST   | `/api/auth/login`    | Public | Login, get JWT    |
| GET    | `/api/auth/me`       | Any    | Get current user  |

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@test.com",
  "password": "secret123"
}
```

**Login body:**
```json
{
  "email": "john@test.com",
  "password": "secret123"
}
```

**Login response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "John Doe",
      "email": "john@test.com",
      "role": "viewer",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Users (Admin only)

| Method | Endpoint          | Description             |
|--------|-------------------|-------------------------|
| GET    | `/api/users`      | List users (paginated)  |
| GET    | `/api/users/:id`  | Get user by ID          |
| POST   | `/api/users`      | Create user with role   |
| PUT    | `/api/users/:id`  | Update name/role/status |
| DELETE | `/api/users/:id`  | Delete user             |

**Query params for GET `/api/users`:**

| Param  | Example             | Description       |
|--------|---------------------|-------------------|
| role   | `?role=analyst`     | Filter by role    |
| status | `?status=active`    | Filter by status  |
| page   | `?page=1`           | Page number       |
| limit  | `?limit=10`         | Items per page    |

**Create user body:**
```json
{
  "name": "Alice",
  "email": "alice@test.com",
  "password": "pass123",
  "role": "analyst"
}
```

**Update user body (all fields optional):**
```json
{
  "name": "Alice B",
  "role": "analyst",
  "status": "inactive"
}
```

---

### Financial Records

| Method | Endpoint             | Access  | Description              |
|--------|----------------------|---------|--------------------------|
| GET    | `/api/records`       | Viewer+ | List records (paginated) |
| GET    | `/api/records/:id`   | Viewer+ | Get single record        |
| POST   | `/api/records`       | Admin   | Create record            |
| PUT    | `/api/records/:id`   | Admin   | Update record            |
| DELETE | `/api/records/:id`   | Admin   | Soft delete record       |

**Query params for GET `/api/records`:**

| Param     | Example                  | Description         |
|-----------|--------------------------|---------------------|
| type      | `?type=income`           | income or expense   |
| category  | `?category=Rent`         | Partial match       |
| date_from | `?date_from=2024-01-01`  | Start date          |
| date_to   | `?date_to=2024-12-31`    | End date            |
| page      | `?page=1`                | Page number         |
| limit     | `?limit=10`              | Items per page      |

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

**Update record body (all fields optional):**
```json
{
  "amount": 5500.00,
  "notes": "Updated salary"
}
```

---

### Dashboard

| Method | Endpoint                          | Access   | Description           |
|--------|-----------------------------------|----------|-----------------------|
| GET    | `/api/dashboard/recent`           | Viewer+  | Last N transactions   |
| GET    | `/api/dashboard/summary`          | Analyst+ | Income, expense, net  |
| GET    | `/api/dashboard/category-totals`  | Analyst+ | Totals by category    |
| GET    | `/api/dashboard/monthly-trends`   | Analyst+ | Monthly trends        |
| GET    | `/api/dashboard/weekly-trends`    | Analyst+ | Weekly trends         |

**Query params:**

| Endpoint           | Params                          |
|--------------------|---------------------------------|
| `/recent`          | `limit` (default 10, max 50)    |
| `/summary`         | `date_from`, `date_to`          |
| `/category-totals` | `type`, `date_from`, `date_to`  |
| `/monthly-trends`  | `months` (default 12, max 24)   |
| `/weekly-trends`   | `weeks` (default 8, max 52)     |

---

## Authentication

All protected routes require a Bearer token in the header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Error Response Format

**General error:**
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

**Validation error (400):**
```json
{
  "success": false,
  "errors": [
    { "msg": "Email is required." },
    { "msg": "Password must be at least 6 characters." }
  ]
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "message": "Access denied. Required: admin. Your role: viewer."
}
```

---

## Assumptions Made

1. **Self-registration** always assigns `viewer` role — only admins can promote users.
2. **Soft delete** is used for financial records (`deletedAt` timestamp); hard delete for users.
3. **Amounts** must always be positive; `type` field (income/expense) determines sign in calculations.
4. **Pagination** defaults to 10 items per page across all list endpoints.
5. **JWT expiry** defaults to 7 days (configurable via `JWT_EXPIRES_IN`).
6. An admin **cannot deactivate, demote, or delete themselves** to prevent lockout.
7. All financial records are linked to the user who created them.

---

## Features Implemented

- ✅ JWT authentication (register, login, token verification)
- ✅ Role-based access control (viewer / analyst / admin)
- ✅ Full CRUD for financial records with soft delete
- ✅ Full CRUD for user management
- ✅ Filtering by type, category, date range
- ✅ Pagination on all list endpoints
- ✅ Dashboard: summary, category totals, monthly trends, weekly trends, recent activity
- ✅ MongoDB aggregation pipelines for analytics
- ✅ Input validation with descriptive error messages
- ✅ Global error handler
- ✅ Request logger
- ✅ Seed script with realistic 12-month financial data
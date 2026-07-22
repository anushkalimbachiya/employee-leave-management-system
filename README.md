# Employee Leave Management System

A full-stack employee leave management & approval system built with Django REST Framework and React.

- **Backend:** Django + Django REST Framework + SQLite / PostgreSQL + JWT (SimpleJWT)
- **Frontend:** React.js (Vite) + React Router + Axios
- **Docs:** Swagger / Redoc via drf-spectacular
- **Bonus:** Console email notifications, Docker/Compose, unit tests

---

## 1. Project structure

```
employee-leave-management-system/
└── leave-management-system/
    ├── backend/                  Django + DRF API
    │   ├── accounts/              custom User model, JWT auth, registration
    │   ├── leaves/                LeaveRequest model, business rules, views
    │   ├── leave_management/      project settings & URLs
    │   ├── requirements.txt
    │   ├── .env.example
    │   └── Dockerfile
    ├── frontend/                 React (Vite) SPA
    │   ├── src/
    │   │   ├── api/                axios instance + resource helpers
    │   │   ├── context/             AuthContext (JWT session state)
    │   │   ├── components/          Layout, LeaveTicket, StatusStamp
    │   │   ├── pages/                Login, Register, Dashboards, Apply, History
    │   │   ├── routes/               ProtectedRoute
    │   │   └── styles/               design tokens + component CSS
    │   ├── .env.example
    │   └── Dockerfile
    ├── docker-compose.yml         Postgres + backend + frontend, one command
    ├── database_schema.sql        Raw PostgreSQL schema (reference)
    └── Employee_Leave_Management.postman_collection.json
```

---

## 2. Quick start (Local Development)

### 2.1 Backend (Django)

```bash
cd leave-management-system/backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Install requirements:
python -m pip install -r requirements.txt

# Run migrations & seed demo data:
python manage.py migrate
python manage.py seed_data

# Run backend server:
python manage.py runserver 0.0.0.0:8000
```

Backend API will run at `http://127.0.0.1:8000/api/` (or `http://localhost:8000/api/`).

### 2.2 Frontend (React / Vite)

```bash
cd leave-management-system/frontend
npm install
npm run dev
```

Frontend app will run at `http://localhost:5173/`.

---

## 3. Demo Credentials

Created automatically by `python manage.py seed_data`:

| Role     | Username    | Password       |
|----------|-------------|----------------|
| Manager  | `manager1`  | `password123`  |
| Employee | `employee1` | `password123`  |

---

## 4. Key API Endpoints

| Method | Endpoint                                   | Who        | Purpose                          |
|--------|---------------------------------------------|------------|-----------------------------------|
| POST   | `/api/auth/login/`                          | Anyone     | Obtain JWT access + refresh token |
| POST   | `/api/auth/login/refresh/`                  | Anyone     | Refresh an expired access token   |
| POST   | `/api/auth/register/`                       | Anyone     | Create employee/manager account   |
| GET    | `/api/auth/me/`                             | Auth'd     | Current user profile              |
| GET    | `/api/leaves/requests/`                     | Auth'd     | List leave requests               |
| POST   | `/api/leaves/requests/`                     | Employee   | Apply for leave                   |
| DELETE | `/api/leaves/requests/{id}/`                | Employee   | Cancel a pending leave request    |
| POST   | `/api/leaves/requests/{id}/decision/`       | Manager    | Approve or reject a request       |
| GET    | `/api/leaves/dashboard/employee/`           | Employee   | Employee dashboard stats          |
| GET    | `/api/leaves/dashboard/manager/`            | Manager    | Manager dashboard stats           |
| GET    | `/api/docs/`                                | Anyone     | Swagger API Documentation         |

---

## 5. Features

- **Authentication**: JWT auth, token auto-refresh, protected routes.
- **Employee Module**: Apply for leave, view status, remaining balance, cancel pending requests.
- **Manager Module**: View team requests, approve/reject requests with comments, view statistics.
- **Validation Guards**: Past date restriction, end date validation, overlap check, leave quota enforcement.

# Employee Leave Management System

A full-stack leave application & approval system built for the Technodha
48-hour take-home assignment.

- **Backend:** Django + Django REST Framework + PostgreSQL + JWT (SimpleJWT)
- **Frontend:** React.js (Vite) + React Router + Axios
- **Docs:** Swagger / Redoc via drf-spectacular
- **Bonus:** Console email notifications, Docker/Compose, unit tests

---

## 1. Project structure

```
leave-management-system/
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

## 2. Quick start with Docker (recommended)

```bash
git clone <this-repo>
cd leave-management-system
cp backend/.env.example backend/.env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Swagger docs: http://localhost:8000/api/docs/
- Django admin: http://localhost:8000/admin/

Then, in a second terminal, run migrations and seed demo data:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_demo_data
```

---

## 3. Manual setup (without Docker)

### 3.1 Backend

**Prerequisites:** Python 3.11+, PostgreSQL 14+

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# Create the database (one-time)
createdb leave_management_db     # or use psql / pgAdmin

python manage.py migrate
python manage.py seed_demo_data   # creates demo manager + employees
python manage.py createsuperuser  # optional, for Django admin access

python manage.py runserver
```

The API is now available at `http://localhost:8000/api/`.

Run the test suite:

```bash
python manage.py test
```

### 3.2 Frontend

**Prerequisites:** Node.js 18+

```bash
cd frontend
npm install

cp .env.example .env
# VITE_API_BASE_URL should point at your backend, e.g. http://localhost:8000/api

npm run dev
```

The app is now available at `http://localhost:5173/`.

---

## 4. Demo credentials

Created by `python manage.py seed_demo_data`:

| Role     | Username    | Password       |
|----------|-------------|----------------|
| Manager  | `manager1`  | `Manager@123`  |
| Employee | `employee1` | `Employee@123` |
| Employee | `employee2` | `Employee@123` |
| Employee | `employee3` | `Employee@123` |

You can also register new accounts from the app's **Create an account** link —
employees pick a manager to report to at signup.

---

## 5. Feature checklist (mapped to the brief)

**Authentication**
- [x] JWT authentication (SimpleJWT, access + refresh, auto-refresh on 401)
- [x] Login API (`POST /api/auth/login/`)
- [x] Protected routes (frontend `ProtectedRoute`, backend `IsAuthenticated`/role permissions)

**Employee module**
- [x] Login, dashboard, apply leave, view leave history, cancel pending leave

**Manager module**
- [x] View all leave requests for their team, approve/reject, filter by status,
      view employee leave statistics (dashboard + all-requests search)

**Leave rules**
- [x] Maximum 20 annual leaves (configurable via `MAX_ANNUAL_LEAVES`)
- [x] Cannot apply for past dates
- [x] End date cannot be before start date
- [x] Cannot apply if it overlaps an existing approved leave

**Dashboards**
- [x] Employee: remaining / approved / pending leave
- [x] Manager: pending requests, approved today, total employees

**Frontend expectations**
- [x] React Router, protected routes, Axios interceptors (auth header +
      auto token refresh), form validation (client + server), responsive UI,
      loading states, error handling

**Backend expectations**
- [x] JWT, DRF ViewSets (`LeaveRequestViewSet`), serializer validation,
      custom permissions (`IsEmployee`, `IsManager`, `IsOwnerOrManager`),
      PostgreSQL, proper models (indexes + check constraints), pagination
      (10/page), search API (`?search=`)

**Bonus**
- [x] Email notification on apply/decision (console backend)
- [x] Docker + docker-compose
- [x] Swagger (`/api/docs/`) and Redoc (`/api/redoc/`) via drf-spectacular
- [x] Unit tests covering every leave rule (`backend/leaves/tests.py`)

---

## 6. Key API endpoints

| Method | Endpoint                                   | Who        | Purpose                          |
|--------|---------------------------------------------|------------|-----------------------------------|
| POST   | `/api/auth/login/`                          | Anyone     | Obtain JWT access + refresh token |
| POST   | `/api/auth/login/refresh/`                  | Anyone     | Refresh an expired access token   |
| POST   | `/api/auth/register/`                       | Anyone     | Create employee/manager account   |
| GET    | `/api/auth/me/`                             | Auth'd     | Current user profile              |
| GET    | `/api/leaves/requests/`                     | Auth'd     | List (own / team) leave requests, filter/search/paginate |
| POST   | `/api/leaves/requests/`                     | Employee   | Apply for leave                   |
| DELETE | `/api/leaves/requests/{id}/`                | Employee   | Cancel a pending leave request    |
| POST   | `/api/leaves/requests/{id}/decision/`       | Manager    | Approve or reject a request       |
| GET    | `/api/leaves/dashboard/employee/`           | Employee   | Employee dashboard stats          |
| GET    | `/api/leaves/dashboard/manager/`            | Manager    | Manager dashboard stats           |
| GET    | `/api/docs/`                                | Anyone     | Swagger UI                        |

Full request/response examples are in
`Employee_Leave_Management.postman_collection.json` — import it into Postman
and set the `base_url` collection variable if your backend runs elsewhere.

---

## 7. Design notes

The frontend uses a "ledger & ticket-stub" visual language: each leave
request renders as a torn travel voucher, with a rotated ink-stamp badge
carrying its status (pending/approved/rejected/cancelled). This was a
deliberate choice to fit the subject matter rather than a generic dashboard
template — see `frontend/src/styles/tokens.css` for the full token system.

## 8. Screenshots / demo video

Add screenshots or a short screen recording of the running app here before
submission, per the assignment's submission requirements.

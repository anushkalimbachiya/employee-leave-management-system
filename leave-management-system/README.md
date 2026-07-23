# 🏢 Employee Leave Management System

A full-stack web application for managing employee leave requests with role-based access for **Employees** and **Managers**.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Django + Django REST Framework |
| Database | PostgreSQL |
| Auth | JWT (SimpleJWT) |
| API Docs | Swagger (drf-spectacular) |

---

## ✨ Features

### 👤 Employee
- Register & login securely
- View leave balance (20 annual days)
- Apply for leave (Annual, Sick, Casual, Unpaid)
- Track leave history & request status

### 🧑‍💼 Manager
- View all team leave requests
- Approve or reject leave requests
- Manage team members

### 🔐 Admin
- Full Django admin panel access
- Manage all users, roles & leave records

---

## 🖥️ Screenshots

### Login Page
![Login](leave-management-system/screenshots/login_page.png)

### Register Page
![Register](leave-management-system/screenshots/register_page.png)

### Employee Dashboard
![Dashboard](leave-management-system/screenshots/dashboard_page.png)

### Django Admin
![Admin](leave-management-system/screenshots/django_admin.png)

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

---

### 🔧 Backend Setup

```bash
cd leave-management-system/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from example)
copy .env.example .env
```

Edit `.env` with your database credentials:
```env
USE_SQLITE=False
DB_NAME=leave_management_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

---

### 🎨 Frontend Setup

```bash
cd leave-management-system/frontend

# Install dependencies
npm install

# Start frontend dev server
npm run dev
```

---

## 🌐 Running URLs

| Service | URL |
|---------|-----|
| Frontend App | http://localhost:5173 |
| Backend API | http://127.0.0.1:8000 |
| Django Admin | http://127.0.0.1:8000/admin |
| API Swagger Docs | http://127.0.0.1:8000/api/schema/swagger-ui/ |

---

## 👥 Default Roles

| Role | Access |
|------|--------|
| `employee` | Apply for leave, view history, track balance |
| `manager` | Approve/reject team leave requests |
| `admin` | Full system access via Django admin |

---

## 📁 Project Structure

```
employee-leave-management-system/
└── leave-management-system/
    ├── backend/
    │   ├── accounts/        # User auth & registration
    │   ├── leaves/          # Leave requests & approvals
    │   ├── leave_management/ # Django settings & URLs
    │   ├── requirements.txt
    │   └── .env.example
    └── frontend/
        ├── src/
        │   ├── pages/       # Login, Register, Dashboard, etc.
        │   ├── components/  # Reusable UI components
        │   ├── api/         # API client & resources
        │   └── context/     # Auth context
        └── package.json
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

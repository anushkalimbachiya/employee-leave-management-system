-- =============================================================================
-- Employee Leave Management System — PostgreSQL Database Schema
-- Generated from Django models (accounts.User, leaves.LeaveRequest)
-- Run `python manage.py migrate` to create this schema automatically; this
-- file is provided as a submission requirement / reference document.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: accounts_user
-- Custom user model extending Django's AbstractUser with role-based fields.
-- ---------------------------------------------------------------------------
CREATE TABLE accounts_user (
    id                    BIGSERIAL PRIMARY KEY,
    password              VARCHAR(128) NOT NULL,
    last_login            TIMESTAMP WITH TIME ZONE,
    is_superuser          BOOLEAN NOT NULL DEFAULT FALSE,
    username              VARCHAR(150) NOT NULL UNIQUE,
    first_name            VARCHAR(150) NOT NULL DEFAULT '',
    last_name             VARCHAR(150) NOT NULL DEFAULT '',
    email                 VARCHAR(254) NOT NULL DEFAULT '',
    is_staff              BOOLEAN NOT NULL DEFAULT FALSE,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined           TIMESTAMP WITH TIME ZONE NOT NULL,
    role                  VARCHAR(10) NOT NULL DEFAULT 'EMPLOYEE'
                          CHECK (role IN ('EMPLOYEE', 'MANAGER')),
    department            VARCHAR(100) NOT NULL DEFAULT '',
    date_joined_company   DATE,
    manager_id            BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL
);

CREATE INDEX idx_accounts_user_manager_id ON accounts_user(manager_id);
CREATE INDEX idx_accounts_user_role ON accounts_user(role);

-- Standard Django auth many-to-many join tables (groups & permissions)
CREATE TABLE accounts_user_groups (
    id       BIGSERIAL PRIMARY KEY,
    user_id  BIGINT NOT NULL REFERENCES accounts_user(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES auth_group(id) ON DELETE CASCADE,
    UNIQUE (user_id, group_id)
);

CREATE TABLE accounts_user_user_permissions (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES accounts_user(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id) ON DELETE CASCADE,
    UNIQUE (user_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- Table: leaves_leaverequest
-- Core leave application record.
-- ---------------------------------------------------------------------------
CREATE TABLE leaves_leaverequest (
    id               BIGSERIAL PRIMARY KEY,
    employee_id      BIGINT NOT NULL REFERENCES accounts_user(id) ON DELETE CASCADE,
    start_date       DATE NOT NULL,
    end_date         DATE NOT NULL,
    reason           TEXT NOT NULL,
    status           VARCHAR(10) NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    applied_on       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_on       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    decided_by_id    BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    decided_on       TIMESTAMP WITH TIME ZONE,
    manager_comment  VARCHAR(500) NOT NULL DEFAULT '',

    CONSTRAINT end_date_gte_start_date CHECK (end_date >= start_date)
);

CREATE INDEX idx_leaverequest_employee_status ON leaves_leaverequest(employee_id, status);
CREATE INDEX idx_leaverequest_date_range ON leaves_leaverequest(start_date, end_date);
CREATE INDEX idx_leaverequest_decided_by ON leaves_leaverequest(decided_by_id);

-- ---------------------------------------------------------------------------
-- Business rules enforced at the application layer (Django serializers),
-- documented here for reference:
--   1. An employee cannot apply for leave with a start_date in the past.
--   2. end_date must be >= start_date (also enforced by the CHECK constraint
--      above as a defense-in-depth measure).
--   3. A new request cannot overlap the date range of any of the employee's
--      existing APPROVED leave requests.
--   4. The sum of (end_date - start_date + 1) across all of an employee's
--      APPROVED requests within a calendar year cannot exceed the configured
--      MAX_ANNUAL_LEAVES (default: 20).
--   5. Only PENDING requests can be cancelled (by the owning employee) or
--      decided (approved/rejected, by that employee's manager).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Sample seed data (also available via: python manage.py seed_demo_data)
-- ---------------------------------------------------------------------------
-- INSERT INTO accounts_user (username, email, first_name, last_name, role, ...)
-- VALUES ('manager1', 'manager1@technodha.com', 'Priya', 'Shah', 'MANAGER', ...);

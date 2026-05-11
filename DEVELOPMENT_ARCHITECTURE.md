# SalonFlow Architecture & Development Flow

This document provides a technical overview of how the SalonFlow SaaS platform is built, detailing the system architecture, application flow, and how various modules and APIs interconnect.

---

## 1. High-Level System Architecture

SalonFlow is a **Multi-Tenant SaaS (Software as a Service)** application built using a modern JavaScript stack.

*   **Frontend**: Next.js (React) using the App Router (`src/app`), styled with Tailwind CSS.
*   **Backend**: Node.js with Express.js for the REST API.
*   **Database**: MySQL, managed via the **Sequelize ORM**.
*   **Authentication**: JSON Web Tokens (JWT) for stateless authentication.

---

## 2. Multi-Tenancy & Data Isolation Model

The core of the system relies on strict data isolation to ensure one salon cannot access another salon's data.

1.  **Tenant Level (`tenantId`)**: Every major table (Users, Customers, Bills, Appointments) contains a `tenantId`. 
    *   *Rule*: A query must *always* include `WHERE tenantId = req.user.tenantId` to prevent data leakage.
2.  **Branch Level (`branchId`)**: Under a single Tenant, data is further segregated by branches.
    *   *Rule*: Branch staff only see data where `branchId = req.branchId`. Admins can view all branches.

---

## 3. Backend Structure (`/backend`)

The backend follows an MVC-like structure (Models, Routes/Controllers, Services).

### Directory Breakdown
*   **`server.js`**: The entry point. It configures CORS, parses JSON, and mounts all route handlers.
*   **`models/`**: Contains Sequelize definitions. `index.js` defines all table associations (e.g., `Bill.belongsTo(Tenant)`).
*   **`routes/`**: The API controllers. Each file (e.g., `bills.js`, `appointments.js`) handles a specific domain.
*   **`middleware/`**: 
    *   `auth.js`: Verifies the JWT and extracts `tenantId` and `branchId`.
    *   `permission.js`: Role-Based Access Control (RBAC). Checks if the user's role has permission for the requested module.
*   **`services/`**: Independent utility classes.
    *   `communication.js`: Handles WhatsApp, SMS, and Email routing with branch-level overrides.
    *   `automation.js`: Background cron jobs (e.g., birthday wishes).

### API Request Flow Example
`GET /api/appointments` -> `server.js` -> `auth.js` (Injects User) -> `permission.js` (Checks Access) -> `appointments.js` (Queries DB) -> Returns JSON.

---

## 4. Frontend Structure (`/frontend`)

The frontend is a Single Page Application (SPA) experience built with Next.js App Router.

### Directory Breakdown
*   **`src/app/`**: Contains the page routes. Each folder (e.g., `/billing`, `/appointments`) represents a URL path and contains a `page.tsx`.
*   **`src/app/layout.tsx`**: The master layout. It wraps the application in the `Sidebar` and handles global state (like active branch selection).
*   **`src/app/components/`**: Reusable UI elements (Sidebar, Modals, Cards).

### State Management & API Communication
*   The frontend uses `axios` (configured in `lib/api.ts` or directly in components) to make HTTP requests.
*   The JWT token is stored in `localStorage` and automatically attached to the `Authorization: Bearer <token>` header for every request.
*   The currently selected Branch ID is passed to the backend via a custom `x-branch-id` header.

---

## 5. Module Interconnectivity (How it ties together)

Modules in SalonFlow are not isolated; they heavily interact with each other. Here is how the core modules interconnect:

### 5.1. Billing & Inventory Flow
1.  **Dependencies**: To create a Bill, the system must fetch `Services`, `Products`, `Staff`, and `Customers`.
2.  **Action**: User submits a Bill via `POST /api/bills`.
3.  **Backend Processing**:
    *   Validates items.
    *   Deducts `stock` from the `Products` table.
    *   Records `Bill` and `BillItems`.
    *   Updates the `Customer` table (`totalVisits` +1, `totalSpent` +amount).
    *   *Trigger*: Calls `CommunicationService` to send a digital receipt (if configured).

### 5.2. Appointments & Scheduling Flow
1.  **Dependencies**: Relies on `Services` (for duration and price), `Staff` (for assignment), and `Branch` (for operating hours).
2.  **Action**: User books an appointment via `POST /api/appointments`.
3.  **Backend Processing**:
    *   Checks if the requested time falls between the branch's `openingTime` and `closingTime`.
    *   If the customer is a "walk-in", it auto-registers them in the `Customers` table.
    *   *Trigger*: Calls `CommunicationService` to send a booking confirmation via WhatsApp/Email.

### 5.3. Roles & Permissions (RBAC) Flow
1.  **Storage**: The `Roles` table stores a JSON array of allowed module keys (e.g., `['billing', 'appointments']`).
2.  **UI Level**: The `Sidebar.tsx` reads the user's permissions from the decoded JWT and hides/shows menu links accordingly.
3.  **API Level**: The `permission.js` middleware intercepts requests. If a Staff member tries to `POST /api/settings`, the middleware reads their permissions, sees `settings` is missing, and returns a `403 Forbidden`.

---

## 6. Extending the System (Adding a New Module)

To add a completely new feature (e.g., "Expenses"):
1.  **Database**: Create `models/Expense.js` and link it to `Tenant` and `Branch` in `models/index.js`.
2.  **Backend API**: Create `routes/expenses.js` with CRUD operations. Secure it using `checkPermission('expenses')`.
3.  **Mount API**: Add `app.use('/api/expenses', ...)` in `server.js`.
4.  **Settings**: Update `TenantSetting.js` default role permissions to include the new `expenses` key.
5.  **Frontend Route**: Create `src/app/expenses/page.tsx` for the UI UI.
6.  **Navigation**: Add the 'Expenses' link to `Sidebar.tsx`, wrapping it in a permission check.

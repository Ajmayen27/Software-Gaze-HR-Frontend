# SoftwareGaze HR Management Portal

SoftwareGaze HR Management Portal is a modern, high-performance, single-page application (SPA) that streamlines organizational human resources, client relationship management, payroll processing, and customer support operations. The application features a premium design system built with custom CSS variables, responsive layouts, micro-animations, glassmorphic dropdowns, and interactive analytics dashboards.

---

## 🚀 Key Modules & Features

### 1. Admin & Manager Dashboard (`/dashboard`)
- **KPI Statistics**: At-a-glance monitoring of total employees, active employees, active clients, departments, and open support tickets.
- **Interactive Analytics** (powered by Recharts):
  - Employee distribution across organizational departments.
  - Client account activation status breakdown.
  - Support ticket status distribution (Open, In Progress, Waiting, Resolved, Closed).
  - Company Monthly Expenses — interactive area charts showing cumulative payroll expenditure.
- **Quick Action Shortcuts**: One-click paths to onboard employees, manage clients, view support tickets, run payroll, and register support staff.

---

### 2. Employee Management (`/employees`)
- **Employee Directory**: Searchable, filterable, paginated employee database with status indicators.
- **Advanced Filters**: Filter by department, designation, location, shift, and employment status simultaneously.
- **Onboarding Wizard** (`/employees/new`): Multi-step guided registration flow covering personal info, job details, and assignments.
- **Employee Profile** (`/employees/:id/profile`): Full individual record with department, designation, location, shift, and contact details.
- **Document Vault** (`/employees/:id/documents`): Structured digital document uploader supporting multiple file categories and verification statuses.
- **CSV Import**: Bulk employee import via CSV file upload.
- **Support Staff Management** (Admin-only): Tab-switched view on the Employee List page lets admins register and browse all `ROLE_SUPPORT_STAFF` agents in a dedicated table.

---

### 3. Payroll Management (`/payroll`)
- **Payroll Runs** (`/payroll/runs`): Initiate, track, and approve monthly payroll cycles with status workflows.
- **Payroll Run Detail** (`/payroll/runs/:id`): Drill-down view of individual run records and breakdown per employee.
- **Salary Components** (`/payroll/components`): Configure allowances, deductions, and tax-mapped formula elements.
- **Salary Groups** (`/salary-groups`): Group-level structures defining base pay percentages and component bindings.
- **Digital Payslips** (`/payroll/payslip/:id`): High-fidelity rendered payslip view per employee per cycle.

---

### 4. Organization Lookups
System configuration panel for core HR master data:
- **Departments** (`/departments`)
- **Designations** (`/designations`) — linked to departments
- **Office Locations** (`/locations`)
- **Work Shifts** (`/shifts`)
- **Salary Groups** (`/salary-groups`)

---

### 5. Client Management (`/clients`)
- **Client List**: Full client directory accessible to Admin and Support Staff.
- **Client Profile** (`/client-profile`): Self-service account configuration, company details, and password management for client users.

---

### 6. Support Tickets (`/support/tickets`)
- **Unified Ticket Grid**: Filterable, searchable, paginated table of support requests with status badges and priority labels.
- **Status Filters**: Quick-filter tabs for `OPEN`, `IN_PROGRESS`, `WAITING_FOR_CLIENT`, `RESOLVED`, `CLOSED`, `REOPENED`.
- **Ticket Detail** (`/support/tickets/:id`):
  - **Real-Time Chat**: WebSocket-powered live message thread using `@stomp/stompjs` — no page refresh required.
  - **Message History**: Full conversation thread with role-aware bubble alignment (Support Team on left, Client on right).
  - **Image Attachments**: Upload up to 3 images (JPEG, PNG, WEBP, max 5 MB each) per message with authenticated inline preview and a full-screen lightbox viewer.
  - **Ticket Assignment**: Set assignee and priority via a modal — transitions the ticket to `IN_PROGRESS`.
  - **Resolution Workflow**: Mark tickets resolved with a resolution note and optional tags.
  - **Client Actions**: Clients can close resolved tickets or reopen closed/resolved tickets.
  - **Info Panel**: At-a-glance sidebar displaying status, priority, category, client details, assigned agent, and timestamps.
- **Client Ticket Creation**: Clients can submit new tickets with title, description, category, and priority directly from the list page.

---

### 7. Support Staff Module
- **Support Dashboard** (`/support/dashboard`): Dedicated analytics view for support agents showing ticket KPIs and charts.
- **Support Staff Registration** (`/support-staff/register`): Admin-only form to create new support agent accounts (`ROLE_SUPPORT_STAFF`). Includes inline success confirmation.
- **Support Staff List** (Admin tab on `/employees`): Admin can view all registered support agents — name, email, and role badge — with a refresh control.
- **Role Permissions**: Support Staff can access:
  - Clients page, Support Tickets list, Ticket Detail, Ticket Assignment, Ticket Resolution, Chat & Attachments.
  - Support Staff are **blocked** from: Employees, Payroll, Salary Setup, and Org Lookup/Settings pages.

---

### 8. Notifications (`NotificationBell`)
- **Live Badge**: Header bell icon showing unread action count.
- **Smart Count Logic**:
  - Tickets with status `OPEN` or `REOPENED` (new unassigned requests).
  - Tickets `IN_PROGRESS` where the client sent the last message (waiting for support response).
- **Quick-Acknowledge Dropdown**: Assign or move tickets to `IN_PROGRESS` directly from the bell dropdown without navigating away.

---

### 9. My Profile (`/my-profile`)
- User profile editor for Admin, Manager, and Support Staff roles.
- Update personal information and change password.

---

### 10. Settings (`/settings`)
- Admin-only application-level configuration (company name, branding, regional settings).

---

## 👥 Role-Based Access Control

| Feature | ROLE_ADMIN | ROLE_MANAGER | ROLE_SUPPORT_STAFF | ROLE_EMPLOYEE | ROLE_CLIENT |
|---|:---:|:---:|:---:|:---:|:---:|
| Admin Dashboard | ✅ | ✅ | ❌ | ❌ | ❌ |
| Employee Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Payroll & Salary | ✅ | ✅ | ❌ | ❌ | ❌ |
| Org Lookups / Settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| Client List | ✅ | ✅ | ✅ | ❌ | ❌ |
| Support Dashboard | ✅ | ✅ | ✅ | ❌ | ❌ |
| Support Tickets (all) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assign / Resolve Tickets | ✅ | ✅ | ✅ | ❌ | ❌ |
| Chat & Attachments | ✅ | ✅ | ✅ | ❌ | ✅ |
| Register Support Staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create / Reopen Tickets | ❌ | ❌ | ❌ | ❌ | ✅ |
| My Profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Client Self-Profile | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ Technology Stack

| Category | Library / Tool |
|---|---|
| Core Framework | [React 19](https://react.dev/) |
| Build Tool | [Vite](https://vite.dev/) |
| Routing | [React Router DOM v7](https://reactrouter.com/) |
| HTTP Client | [Axios](https://axios-http.com/) with JWT interceptors |
| Real-Time Messaging | [STOMP.js over WebSocket](https://stomp-js.github.io/stomp-websocket/) |
| Charts & Visuals | [Recharts](https://recharts.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Toast Notifications | [React Hot Toast](https://react-hot-toast.com/) |
| Styling | Vanilla CSS with CSS custom properties (`src/index.css`) |

---

## 📁 Project Directory Structure

```text
SoftwareGaze HR Frontend/
├── public/                        # Static assets (logo, favicon)
├── src/
│   ├── api/                       # Axios config and API helper wrappers
│   │   ├── axiosInstance.js       # Base URL, JWT interceptors, token refresh & error unwrapping
│   │   ├── clients.js             # Client CRUD endpoints
│   │   ├── lookups.js             # Department / location / designation / shift lookups
│   │   ├── payroll.js             # Payroll runs, components, payslips
│   │   └── support.js             # Tickets, messages, attachments, workflow actions, support staff list
│   │
│   ├── components/                # Reusable UI widgets
│   │   ├── NotificationBell.jsx   # Live notification bell with smart unread count
│   │   └── ui/                    # Generic Button, Input, etc.
│   │
│   ├── context/
│   │   └── AuthContext.jsx        # Login, logout, token storage, role state, user profile
│   │
│   ├── layouts/
│   │   ├── AuthLayout.jsx         # Centered layout for login / register pages
│   │   └── DashboardLayout.jsx    # Role-aware sidebar navigation + header
│   │
│   ├── pages/
│   │   ├── clients/
│   │   │   ├── ClientList.jsx     # Paginated client directory
│   │   │   └── ClientProfile.jsx  # Client self-service profile editor
│   │   ├── payroll/
│   │   │   ├── PayrollRuns.jsx
│   │   │   ├── PayrollRunDetail.jsx
│   │   │   ├── SalaryComponents.jsx
│   │   │   └── PayslipDetail.jsx
│   │   ├── support/
│   │   │   ├── SupportDashboard.jsx      # KPI analytics for support agents
│   │   │   ├── SupportTickets.jsx        # Ticket list with status filters
│   │   │   ├── TicketDetail.jsx          # Real-time chat, actions, and info panel
│   │   │   └── RegisterSupportStaff.jsx  # Admin form to create support agent accounts
│   │   ├── wizard/
│   │   │   └── EmployeeWizard.jsx        # Multi-step employee onboarding wizard
│   │   ├── Dashboard.jsx          # Admin/Manager analytics dashboard
│   │   ├── EmployeeList.jsx       # Employee directory + support staff tab
│   │   ├── EmployeeProfile.jsx    # Individual employee record
│   │   ├── DocumentUpload.jsx     # Employee document vault
│   │   ├── MyProfile.jsx          # Logged-in user profile editor
│   │   ├── LookupPage.jsx         # Generic CRUD panel for org lookups
│   │   └── Settings.jsx           # Application settings (Admin only)
│   │
│   ├── index.css                  # Design tokens, CSS variables, typography, animations
│   ├── main.jsx                   # React DOM root injection
│   └── App.jsx                    # Route declarations and role guards
│
├── eslint.config.js
├── vite.config.js
└── package.json
```

---

## ⚡ Getting Started

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) **v18 or above** and `npm` installed.

The backend REST API and WebSocket server must be running at:
```
http://localhost:8081/api/v1
ws://localhost:8081/api/v1/ws
```

### 1. Clone & Install

```bash
git clone <repository-url>
cd "SoftwareGaze HR Frontend"
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build

```bash
npm run build
```

Preview the production bundle locally:
```bash
npm run preview
```

---

## 🔒 Security & Authorization

Authentication is managed via **JSON Web Tokens (JWT)**:
- `sessionStorage` — short-lived `accessToken` for API requests.
- `localStorage` — persistent `refreshToken` for automatic session renewal.

The Axios interceptor automatically attaches the Bearer token to every request and silently refreshes expired tokens using the refresh endpoint. On a failed refresh, the user is redirected to `/login`.

### Route Guards

| Guard | Allowed Roles | Redirect on Deny |
|---|---|---|
| `RequireHrPayroll` | ADMIN, MANAGER | → `/support/tickets` or `/my-profile` |
| `RequireClientManagement` | ADMIN, SUPPORT_STAFF | → `/support-tickets` |
| `RequireSupportStaffArea` | ADMIN, MANAGER, SUPPORT_STAFF, CLIENT | → `/my-profile` |
| `RequireAdmin` | ADMIN only | → `/dashboard` |

### Default Redirects After Login

| Role | Landing Page |
|---|---|
| `ROLE_ADMIN` / `ROLE_MANAGER` | `/dashboard` |
| `ROLE_SUPPORT_STAFF` | `/support/tickets` |
| `ROLE_EMPLOYEE` | `/my-profile` |
| `ROLE_CLIENT` | `/support-tickets` |

---

## 🔌 Backend API Reference

All API calls are proxied through `axiosInstance` to the base URL `http://localhost:8081/api/v1`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login and receive JWT tokens |
| POST | `/auth/register` | Register a new HR user |
| POST | `/auth/refresh-token` | Renew access token |
| POST | `/auth/support-staff/register` | Admin: create a support staff account |
| GET | `/auth/support-staff` | Admin: list all support staff agents |

### Employees
| Method | Endpoint | Description |
|---|---|---|
| GET | `/employees` | Paginated list with search & filters |
| POST | `/employees` | Create new employee |
| GET | `/employees/:id` | Get employee by ID |
| PUT | `/employees/:id` | Update employee record |
| DELETE | `/employees/:id` | Remove employee |
| PATCH | `/employees/:id/status` | Toggle Active / Inactive |
| POST | `/employees/import` | Bulk import via CSV |

### Support Tickets
| Method | Endpoint | Description |
|---|---|---|
| GET | `/support-tickets` | All tickets (paginated, filterable) |
| POST | `/support-tickets` | Client: create a new ticket |
| GET | `/support-tickets/:id` | Get ticket details |
| PATCH | `/support-tickets/:id/assign` | Assign ticket & set priority |
| PATCH | `/support-tickets/:id/resolve` | Resolve with note and tags |
| PATCH | `/support-tickets/:id/close` | Client: close resolved ticket |
| PATCH | `/support-tickets/:id/reopen` | Client: reopen ticket |
| GET | `/support-tickets/:id/messages` | Fetch message thread |
| POST | `/support-tickets/:id/message-attachments` | Upload image attachments |

### WebSocket (Real-Time Chat)
| Direction | Destination | Description |
|---|---|---|
| Publish (send) | `/app/support-tickets/{id}/messages` | Send a message to a ticket thread |
| Subscribe (receive) | `/topic/support-tickets/{id}/messages` | Receive live messages for a ticket |

---

## 📄 License

This project is proprietary software developed for **SoftwareGaze**. All rights reserved.

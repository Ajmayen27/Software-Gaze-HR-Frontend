# SoftwareGaze HR Management Portal

SoftwareGaze HR Management Portal is a modern, high-performance, single-page application (SPA) designed to streamline organizational human resources operations, client support, and payroll management. The application features a premium design system built with custom CSS variables, responsive layouts, glassmorphic dropdowns, and interactive dashboards.

---

## 🚀 Key Modules & Features

### 1. Admin Dashboard (`/dashboard`)
*   **KPI Statistics**: At-a-glance monitoring of total employees, active employees, active clients, departments, and active tickets.
*   **Interactive Analytics**: Fully integrated charts (powered by Recharts) visualizing:
    *   Employee distribution across organizational departments.
    *   Client account activation status.
    *   Support tickets status (Open, In Progress, Waiting, Resolved, Closed).
    *   Company Monthly Expenses (interactive area charts displaying cumulative payroll expenditure).
*   **Quick Action Shortcuts**: Direct paths for on-boarding employees, managing clients, viewing support tickets, and running payroll.

### 2. Client Self-Service Portal
*   **Client Profiles**: Account configuration, security settings, and password updates.
*   **Support Board**: Submit, track, close, and reopen tickets with priority labels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and categories.

### 3. Support Desks & Tickets (`/support-tickets`)
*   **Unified Ticket Grid**: Comprehensive filterable and searchable table of support requests with active status indicators.
*   **Real-time Notifications**: A custom `NotificationBell` widget in the top-right header that polls the backend to calculate:
    *   Tickets with status `OPEN` or `REOPENED` (new incoming messages).
    *   Tickets with status `IN_PROGRESS` where the client sent the last message.
    *   *Quick Acknowledge action* directly inside the dropdown to assign/move tickets to `IN_PROGRESS` immediately.
*   **Discussion Thread**: Standardized message threads complete with role color-coding, timelines, support assignments, resolution notes, and tagging.

### 4. Employee Management (`/employees`)
*   **Employee Database**: Clean tabular database containing full details, designation, and status indicators.
*   **Onboarding Wizard**: Multi-step registration flow to standardise employee info gathering.
*   **Document Vault**: Structured digital document uploader supporting multiple categories and status verification.

### 5. Payroll Management (`/payroll`)
*   **Payroll Runs**: Track, process, and approve monthly payroll operations.
*   **Salary Components & Groups**: Flexible formulas mapping base pay, allowances, deductions, and tax configurations.
*   **Digital Payslips**: High-fidelity HTML view of processed compensation reports.

### 6. Organization Lookups
*   System configuration panel to set up and reference:
    *   **Departments**
    *   **Designations**
    *   **Office Locations**
    *   **Work Shifts**
    *   **Salary Groups**

---

## 🛠️ Technology Stack

*   **Core framework**: [React 19](https://react.dev/)
*   **Build tool**: [Vite 8](https://vite.dev/)
*   **Routing**: [React Router DOM v7](https://reactrouter.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Charts & Visuals**: [Recharts](https://recharts.org/)
*   **Toast Alert Notifications**: [React Hot Toast](https://react-hot-toast.com/)
*   **Transitions**: [Framer Motion](https://www.framer.com/motion/)
*   **Styling**: Modern Vanilla CSS Variables (`src/index.css`)

---

## 📁 Project Directory Structure

```text
SoftwareGaze HR Frontend/
├── public/                  # Static assets and site icons
├── src/
│   ├── api/                 # Axios configuration and API helper wrappers
│   │   ├── axiosInstance.js # Interceptors, authentication token management
│   │   ├── clients.js       # Client API endpoints
│   │   ├── lookups.js       # Lookup configurations endpoints
│   │   ├── payroll.js       # Compensation and runs endpoints
│   │   └── support.js       # Tickets and message threads endpoints
│   │
│   ├── components/          # Reusable UI controls
│   │   ├── ui/              # Generic Buttons and Form Inputs
│   │   └── NotificationBell # Header message notifications widget
│   │
│   ├── context/             # React Context providers
│   │   └── AuthContext.jsx  # Login, Token storage, Session control, Role auth
│   │
│   ├── layouts/             # Page structural layouts
│   │   ├── AuthLayout.jsx   # Layout for login/registration forms
│   │   └── DashboardLayout.js  # Main sidebar-guided panel
│   │
│   ├── pages/               # Domain-specific modules and screens
│   │   ├── clients/         # Client profiles and list
│   │   ├── payroll/         # Compensation, runs, and component setup
│   │   ├── support/         # Support board, details, and message feeds
│   │   ├── wizard/          # Onboarding step-by-step screens
│   │   ├── Dashboard.jsx    # Analytics dashboard
│   │   └── Settings.jsx     # General application settings
│   │
│   ├── index.css            # Central styling tokens, variables, and typography
│   ├── main.jsx             # React DOM injection point
│   └── App.jsx              # Main routing declaration
├── eslint.config.js         # Lint checks configuration
├── vite.config.js           # Vite server settings
└── package.json             # NPM dependencies
```

---

## ⚡ Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or above) and npm installed.

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Run the Development Server
Launch the development build locally:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

### 3. Production Build
To build and bundle the project files for production deployment:
```bash
npm run build
```

To preview the production bundle locally:
```bash
npm run preview
```

---

## 🔒 Security & Authorization

Authentication is managed via JSON Web Tokens (JWT) stored in `sessionStorage` (for short-term session access) and `localStorage` (for persistent refresh tokens). The application has role-based protection routing:
*   **ROLE_ADMIN** / **ROLE_MANAGER**: Full dashboard, employee setup, payroll runs, settings, and full ticketing desk.
*   **ROLE_EMPLOYEE**: Self-service profile, documents, and individual payslips.
*   **ROLE_CLIENT**: Self-service support board, client profiling, and support chat.

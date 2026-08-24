# CRM Gangatara — Project Workflow & Module Guide

This document explains how the whole application fits together: the request/data
flow, the role-based access model, and exactly what each dashboard/page does.

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Build tool | Vite |
| UI library | React 19 |
| Styling | Tailwind CSS (primary color `#3a56b0`) |
| Routing | React Router DOM v7 |
| Charts | Recharts |
| Icons | lucide-react |
| State | React Context API (`AuthContext`, `UIContext`) + local component state |
| Data | Mock JSON in `src/services/mockData.js` (swap-in point for a real API) |

---

## 2. High-Level Flow (how a screen gets on screen)

```
main.jsx
  -> App.jsx (BrowserRouter, AuthProvider, ToastProvider)
       -> /login, /forgot-password, /reset-password   (public routes)
       -> RequireAuth                                  (auth guard)
            -> DashboardLayout                          (Sidebar + Navbar + RoleTabs + <Outlet/>)
                 -> RequirePermission (per-route role check)
                      -> Page component (Dashboard, Leads, Clients, ...)
                           -> reads mock data from services/mockData.js
                           -> renders with reusable components/common/*
```

1. **`main.jsx`** mounts `<App />` into `#root`.
2. **`App.jsx`** wraps everything in `AuthProvider` (who is logged in / their role)
   and `ToastProvider` (global toast notifications), then declares all routes.
3. Every authenticated route is nested under **`RequireAuth`**, which checks
   `AuthContext.isAuthenticated` and redirects to `/login` if false.
4. Authenticated routes render inside **`DashboardLayout`**, which is the shared
   shell: `Sidebar` (left) + `Navbar` (top) + `RoleTabs` (role preview strip) +
   the page content via `<Outlet />`.
5. Each individual route is additionally wrapped in **`RequirePermission`**,
   which checks the current role against `constants/roles.js` and bounces back
   to `/dashboard` if that role isn't allowed on that page.
6. Inside a page, data currently comes from **`services/mockData.js`** — arrays
   like `leads`, `clients`, `projects`, `payments`, etc. Pages copy this into
   local `useState` so add/edit/delete work in-memory for the demo. This is the
   single file to swap out when a real backend is connected.

---

## 3. Authentication Flow

```
Login page (/login)
  -> user fills email + password (+ picks a "Demo role" dropdown)
  -> AuthContext.login({ email, password, role }) is called
       -> simulates a network call (600ms delay)
       -> looks up a matching demo user for that role in mockData.users
       -> stores the resulting user object (id, name, role, avatar) in
          React state AND localStorage ("crm_user"), so refresh keeps you logged in
  -> navigate("/dashboard")
```

- **Forgot Password** (`/forgot-password`): collects an email, "sends" a reset
  link (simulated), then offers a button through to Reset Password.
- **Reset Password** (`/reset-password`): new password + confirm, with basic
  validation (min 8 chars, must match), shows a toast, redirects to `/login`.
- **Logout**: `AuthContext.logout()` clears the user from state + localStorage
  (accessible from the Navbar's profile dropdown).
- **Role Tabs** (`RoleTabs`, shown under the Navbar on every authenticated
  page): calls `AuthContext.switchRole(role)` to instantly swap the logged-in
  user's role without a full re-login, so you can preview how the sidebar and
  route access change per role.

---

## 4. Role-Based Access Control

Defined in **`src/constants/roles.js`**:

| Role | Key | Access |
|---|---|---|
| Admin | `admin` | Everything (`"*"`) |
| BD / Sales | `sales` | Dashboard, Leads, Pipeline, Clients, Communication, Documents, Notifications, Activity, Reports, Profile, Settings |
| Marketing | `marketing` | Dashboard, Campaigns, Lead Sources, Marketing Analytics, Leads, Documents, Notifications, Activity, Reports, Profile, Settings |
| Project Manager | `project_manager` | Dashboard, Projects, Clients, Communication, Documents, Notifications, Activity, Reports, Profile, Settings |
| Finance | `finance` | Dashboard, Payments, Clients, Projects, Reports, Documents, Notifications, Activity, Profile, Settings |

This list drives **two** things, not just one, so it's a real permission
system rather than cosmetic hiding:
1. **`Sidebar.jsx`** filters `NAV_SECTIONS` (from `constants/navigation.js`)
   through `canAccess(role, key)` — items the role can't see are not rendered.
2. **`RequirePermission`** (in `routes/ProtectedRoute.jsx`) re-checks the same
   `canAccess()` at the route level — so typing a restricted URL directly
   still redirects to `/dashboard`, it isn't just a hidden button.

---

## 5. Layout Shell (present on every authenticated page)

- **Sidebar** (`components/layout/Sidebar.jsx`)
  - Desktop: fixed left column, collapsible (icon-only) via the chevron button.
  - Mobile: becomes a slide-in drawer with an overlay, opened by the navbar's
    hamburger icon and closed by tapping outside or the X button.
  - Sectioned nav: **Main** (Dashboard, Leads, Sales Pipeline, Clients,
    Projects, Payments, Reports) / **Marketing** (Campaigns, Lead Sources,
    Marketing Analytics) / **Management** (Communication, Documents,
    Notifications, Activity Logs) / **Settings** (Profile, Settings).
- **Navbar** (`components/layout/Navbar.jsx`)
  - Global search box (UI only in this demo build).
  - Notifications bell with unread-count badge and a dropdown preview of the
    latest 6 notifications, "View all" -> `/notifications`.
  - Profile menu (avatar, name, role) -> My Profile / Settings / Log out.
- **RoleTabs** (`components/layout/RoleTabs.jsx`) — the "Preview as:" strip
  described above.
- **PageHeader** — every page's title/subtitle/primary-action row, kept
  consistent across modules.

---

## 6. Every Dashboard / Page — What It Does

### Dashboard (`/dashboard`)
- Hero banner with a role-aware greeting and 4 quick-action shortcuts (Add
  Lead, Log Call, New Invoice, New Project).
- Horizontally scrollable KPI strip: Total Leads, New Today, Active Deals,
  Won (Month), Active Projects, Pending ₹, Follow-ups Today, Overdue Tasks.
- Charts: Revenue Overview (area chart, paid vs pending by month), Sales
  Pipeline (bar chart of deal counts per stage), Lead Sources (donut chart).
- Side panels: Follow-ups Today, Top Clients (by contract value), Recent
  Activity feed.

### Leads (`/leads`)
- Searchable, filterable (source, status), paginated table of all leads.
- Add/Edit via a modal form (`LeadFormModal`) with validation.
- Row actions: View, Edit, Assign BD, Call, Email, Delete (with confirm
  dialog).
- Status badges follow the pipeline stages (New -> ... -> Won/Lost).

### Sales Pipeline (`/pipeline`)
- Kanban board, one column per stage (New Lead -> Contacted -> Qualified ->
  Meeting -> Proposal Sent -> Negotiation -> Won -> Lost).
- Native HTML5 drag-and-drop: dragging a deal card into another column
  updates its status and fires a success toast.
- Each column shows deal count + total value; board scrolls horizontally on
  small screens.

### Clients (`/clients`) + Client Detail (`/clients/:id`)
- List page: search, status filter, add/edit/delete, contract/paid/pending
  columns, click a row to open the detail page.
- Detail page tabs: **Overview** (contact info), **Projects** (linked
  projects with progress bars), **Financial** (linked invoices), **
  Communication** (timeline of logged interactions), **Documents** (linked
  files), **Activity** (audit trail).

### Projects (`/projects`) + Project Detail (`/projects/:id`)
- List page: grid or list view toggle, search, status filter, create/edit via
  modal, priority + status badges, progress bars, task counts.
- Detail page tabs: **Overview**, **Requirements** (checklist), **Tasks**
  (this project's task list — status/priority/assignee), **Documents**,
  **Activity**.
- Note: the standalone Tasks *module* (task board across all projects) was
  removed per request — task tracking now lives only inside each project's
  detail page.

### Payments (`/payments`)
- Summary KPI cards: Total Revenue, Total Paid, Total Pending, Overdue.
- Table of invoices with client/project/amount/paid/pending/due date/status.
- Record/edit a payment via modal; delete with confirmation.

### Marketing
- **Campaigns** (`/marketing/campaigns`): budget vs spend progress bars, leads
  -> qualified -> proposals -> won funnel counts, computed ROI badge, create/
  edit campaigns via modal.
- **Lead Sources** (`/marketing/lead-sources`): bar chart of lead volume per
  channel + per-channel conversion-rate cards.
- **Marketing Analytics** (`/marketing/analytics`): spend/lead trend line
  chart, cost-per-lead and overall ROI KPIs, radar chart comparing channel
  win-rate.

### Communication (`/communication`)
- Unified timeline of Calls / Emails / Messages / Notes across all clients.
- Search + type filter; "Log Communication" modal to add a new entry.

### Documents (`/documents`)
- Grid of document cards (proposal/contract/invoice/requirement/other),
  linked to a client + project.
- Upload (native file picker, simulated), search, filter by type, download/
  delete actions per card.

### Notifications (`/notifications`)
- Full notification center (lead assigned, follow-up due, proposal accepted,
  payment received/overdue, task assigned, message received).
- Unread indicator, "Mark all as read", click-to-read individual items.

### Activity Logs (`/activity`)
- Full audit trail table: User / Action / Module / Description / Date / Time.
- Filters by user and module, plus free-text search.

### Reports (`/reports`)
- Four tabs in one page: **Sales** (conversion rate, won/lost, leads table),
  **Marketing** (spend, revenue, ROI, source breakdown pie + campaign table),
  **Projects** (active/completed/delayed counts, task completion %, project
  table), **Financial** (revenue/paid/pending/overdue KPIs + bar chart).

### Profile (`/profile`)
- Avatar, name, designation, role badge, contact info, editable personal
  details form.

### Settings (`/settings`)
- Tabs: **General** (language/timezone/date format), **Notifications**
  (toggle switches per alert type), **Security** (password change form),
  **Company** (company name/website/support email).

---

## 7. Reusable Component Library (`src/components/common`)

Button, Badge (status-color aware), Card/CardHeader, Modal, Field/Input/
Select/Textarea, Table/Tr/Td, Pagination, SearchBar/FilterSelect, Avatar,
ProgressBar, Tabs, Tooltip, Toast system (`useToast()`), ConfirmDialog,
EmptyState/LoadingState/ErrorState/Skeleton, ActionsMenu (row dropdown).
Every module-specific page is built by composing these, so visuals and
interaction patterns stay consistent everywhere.

---

## 8. Connecting a Real Backend (when ready)

1. Add `src/services/api.js` with fetch/axios calls shaped like the exports
   in `mockData.js` (`leads`, `clients`, `projects`, `payments`, ...).
2. In each page, replace `useState(initialX)` with a fetch-on-mount hook
   calling the new API functions (loading/empty/error states are already
   built into `components/common/States.jsx`, just wire them up).
3. Point `AuthContext.login()` at a real `/auth/login` endpoint — it already
   expects to return a `user` object containing a `role`, which is what the
   whole permission system keys off.

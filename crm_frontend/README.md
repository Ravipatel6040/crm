# CRM Gangatara — React + Tailwind CSS Frontend

A fully responsive, production-style CRM / Business Operating System frontend built with **React 19**, **Vite**, **Tailwind CSS**, and **React Router**. Uses mock JSON data so it runs standalone, and is structured to be easy to wire up to a real Node.js/REST backend later.

## Getting Started

```bash
npm install
npm run dev       # start local dev server
npm run build     # production build (outputs to /dist)
npm run preview   # preview the production build
```

Open the printed local URL (usually `http://localhost:5173`).

## Login

There's no real backend — authentication is simulated. On the login screen:
- Enter any email/password
- Pick a **Demo role** from the dropdown to preview role-based sidebar/route access (Admin, BD/Sales, Marketing, Project Manager, Finance)
- Click **Sign in**

## What's included

- **Design system**: primary `#3a56b0` + white, with a full Tailwind color scale (`primary-50` … `primary-950`), rounded cards, subtle shadows, consistent spacing
- **Layout**: collapsible desktop sidebar, mobile drawer with overlay, sticky top navbar with search, notifications dropdown, and profile menu
- **Modules**: Dashboard (KPIs + charts), Leads, Sales Pipeline (drag-and-drop Kanban), Clients (+ detail page with tabs), Projects (grid/list + detail page), Tasks (Kanban/list), Payments, Marketing (Campaigns, Lead Sources, Analytics), Communication, Documents, Notifications, Activity Logs, Reports, Profile, Settings
- **Auth**: Login, Forgot Password, Reset Password, protected routes
- **Role-based access**: sidebar items and routes are filtered per role (see `src/constants/roles.js`); unauthorized routes redirect rather than just hiding buttons
- **Reusable components**: Button, Badge, Card, Modal, Table, Pagination, SearchBar/Filter, Select/Input/Textarea, Avatar, ProgressBar, Tabs, Tooltip, Toast, ConfirmDialog, EmptyState/LoadingState/ErrorState, ActionsMenu — all in `src/components/common`
- **Fully responsive**: sidebar → drawer, tables → horizontal scroll, kanban → horizontal scroll, forms → single column, all via Tailwind breakpoints

## Folder structure

```
src/
├── components/
│   ├── common/          # reusable UI primitives
│   ├── layout/          # Sidebar, Navbar, DashboardLayout, PageHeader
│   ├── dashboard/       # KPI cards, charts
│   ├── leads/ pipeline/ clients/ projects/ tasks/ payments/  # module-specific pieces
├── pages/                # route-level pages, mirrors the modules above
├── context/              # AuthContext (login/role), UIContext (sidebar/drawer state)
├── hooks/                # usePagination
├── services/             # mockData.js — swap this for real API calls later
├── routes/               # RequireAuth / RequirePermission route guards
├── constants/            # roles.js, navigation.js
└── utils/                # formatting helpers
```

## Connecting to a real backend

All data currently comes from `src/services/mockData.js`. To connect a Node.js API:

1. Create `src/services/api.js` with fetch/axios calls mirroring the shape of the mock data exports.
2. Replace `useState(initialX)` calls in each page with a data-fetching hook that calls your new API functions.
3. `AuthContext.jsx`'s `login()` function is the one place to swap for a real `/auth/login` call — it already returns a `user` object with a `role` field that drives the whole permission system.

## Notes

- Talent Acquisition / ATS and Developer Dashboard modules are intentionally excluded per spec.
- Charts are built with `recharts`; icons with `lucide-react`.

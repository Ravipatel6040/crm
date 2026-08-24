# Redux Toolkit Integration — What Changed

## New Redux Toolkit layer (`src/store/`)

- `store.js` — root store (`auth` slice + RTK Query `api` reducer)
- `axiosBaseQuery.js` — adapts the existing `services/api.js` axios instance
  (baseURL, `withCredentials`, auth-token interceptor) into an RTK Query
  `baseQuery`, so there's one HTTP client for the whole app.
- `api/apiSlice.js` — a single `createApi` slice with **every** endpoint from
  `API_SPEC.md` (auth, users, leads, pipeline/deals, clients, projects +
  project tasks, payments, marketing/campaigns, communications, documents,
  notifications, activity logs, dashboard aggregates, reports, products,
  services, settings). ~60 auto-generated hooks (`useGetLeadsQuery`,
  `useCreateLeadMutation`, etc.), each with proper cache `tagTypes` so
  writes invalidate/refetch the right reads automatically.
- `slices/authSlice.js` — plain RTK slice for the logged-in user/token,
  persisted to `localStorage`, with a `loginUser` thunk (tries
  `/admin/login` then falls back to `/users/login`, same as before).

`src/context/AuthContext.jsx` was **rewritten to be Redux-backed
internally**, but kept the exact same `useAuth()` return shape
(`{ user, login, logout, loading, isAuthenticated, error }`). That means
none of the components that already call `useAuth()` — Navbar, Sidebar,
RoleTabs, ProtectedRoute, Login, Profile, Settings, Dashboard — needed to
change. `main.jsx` now wraps the app in `<Provider store={store}>`.

## New: Admin "Create Account" feature

- `src/pages/users/Accounts.jsx` — Team Accounts page (Admin-only route,
  `/accounts`). Search, filter by role, paginate, create/edit/delete
  accounts for **BD/Sales, Marketing, Project Manager, Finance and Admin**
  — wired to `useGetUsersQuery` / `useCreateUserMutation` /
  `useUpdateUserMutation` / `useDeleteUserMutation`.
- `src/components/users/UserFormModal.jsx` — the create/edit form (name,
  email, phone, designation, role, status, temp password on create).
- Added to `constants/navigation.js` (new "Administration" section) and
  `App.jsx` (`/accounts` route, gated by `RequirePermission`). Since only
  `ROLES.ADMIN` has `"*"` access in `constants/roles.js`, the nav item and
  route are invisible/blocked for every other role automatically.

## New: Role-based dashboards (`src/pages/dashboard/`)

`Dashboard.jsx` is now a thin router that renders the right dashboard for
`user.role`:

| Role | File | Focus |
|---|---|---|
| Admin | `AdminDashboard.jsx` | Org-wide KPIs, capability shortcuts to all 9 admin actions from the spec, sales/support team monitoring, create-account CTA |
| BD / Sales | `SalesDashboard.jsx` | Leads, pipeline, follow-ups, assigned leads, customers |
| Marketing | `MarketingDashboard.jsx` | Campaigns, ROI, channel performance, lead sources |
| Project Manager | `ProjectDashboard.jsx` | Active projects, task completion, at-risk projects |
| Finance | `FinanceDashboard.jsx` | Revenue, collection rate, overdue invoices |

All of them pull data through the RTK Query hooks above instead of the
static `mockData.js` arrays. `components/dashboard/Charts.jsx` was changed
from importing mock arrays directly to accepting a `data` prop, so it can
be fed real API data from any dashboard.

## Verified

`npm install && npm run build` completes with no errors (Vite production
build succeeds).

## Not yet migrated (still reads from `services/mockData.js`, which is now
   empty arrays)

These existing list/detail pages still do local `useState(initialX)` seeded
from `mockData` and haven't been rewired to the new `apiSlice` hooks yet:

`Leads`, `Clients` / `ClientDetail`, `Projects` / `ProjectDetail`,
`Payments`, `Pipeline`, `Campaigns`, `LeadSources`, `MarketingAnalytics`,
`Communication`, `Documents`, `Notifications`, `ActivityLogs`, `Reports`,
`Products`, `Services`, and the `Navbar` notification-bell dropdown — plus
the small form modals (`LeadFormModal`, `PaymentFormModal`,
`ProjectFormModal`, `DealCard`) that source dropdown options (statuses,
sources, assignees) from `mockData`.

The pattern to migrate each one is the same and is already established by
`Accounts.jsx` / the new dashboards:

```jsx
// before
import { leads as initialLeads } from "../../services/mockData";
const [leads, setLeads] = useState(initialLeads);

// after
import { useGetLeadsQuery, useCreateLeadMutation, useUpdateLeadMutation, useDeleteLeadMutation } from "../../store/api/apiSlice";
const { data, isLoading, isError } = useGetLeadsQuery();
const leads = data?.data ?? data ?? [];
const [createLead] = useCreateLeadMutation();
```

Happy to do this next page-by-page if you want the rest wired up too.

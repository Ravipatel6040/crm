# CRM Gangatara — Possible API Endpoints (Backend Spec)

The frontend currently runs entirely on mock data (`src/services/mockData.js`).
This document lists the REST API surface a Node.js backend would need to
expose to power every screen — grouped by module, with method, endpoint,
purpose, and the request/response shape inferred from the data each page
already uses. Use this as the contract when you build `src/services/api.js`.

Base URL suggestion: `https://api.crmgangatara.com/v1`
Auth: Bearer JWT in `Authorization` header, obtained from `/auth/login`.

---

## 1. Authentication & Session

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Email + password login, returns `{ token, user }` |
| POST | `/auth/logout` | Invalidate current session/token |
| POST | `/auth/forgot-password` | Send reset link to email |
| POST | `/auth/reset-password` | Set new password using reset token |
| GET | `/auth/me` | Return the currently logged-in user (session check on refresh) |
| POST | `/auth/refresh-token` | Exchange refresh token for a new access token |

**`user` object shape** (drives the whole role system):
```json
{
  "id": "u1",
  "name": "Aman Verma",
  "email": "aman.verma@crmgangatara.com",
  "role": "admin | sales | marketing | project_manager | finance",
  "avatar": "AV",
  "designation": "Operations Head"
}
```

---

## 2. Users & Team

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/users` | List team members (for "Assigned To" dropdowns) |
| GET | `/users/:id` | Single user detail |
| PATCH | `/users/:id` | Update profile (Profile page save) |
| PATCH | `/users/:id/password` | Change password (Settings > Security) |
| GET | `/users/:id/activity` | Activity feed for one user |

---

## 3. Leads

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/leads?search=&source=&status=&page=&pageSize=` | Leads table (search/filter/pagination) |
| GET | `/leads/:id` | Single lead detail |
| POST | `/leads` | Create lead (Add Lead modal) |
| PATCH | `/leads/:id` | Edit lead / change status / assign BD |
| DELETE | `/leads/:id` | Delete lead |
| GET | `/leads/sources` | Distinct lead sources list (Website, Instagram, ...) |

**Lead shape:**
```json
{
  "id": "L-1024", "name": "", "company": "", "phone": "", "email": "",
  "source": "Website", "interestedIn": "", "budget": 0,
  "assignedTo": "u2", "status": "New", "nextFollowUp": "2026-08-19", "notes": ""
}
```

---

## 4. Sales Pipeline (Kanban)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/pipeline/deals` | All deals grouped by stage (or same as `/leads`, grouped client-side) |
| PATCH | `/pipeline/deals/:id/stage` | Drag-and-drop stage change, body `{ status: "Negotiation" }` |
| GET | `/pipeline/stages` | Ordered list of pipeline stage names |

---

## 5. Clients

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/clients?search=&status=&page=` | Clients table |
| GET | `/clients/:id` | Client profile (Overview tab) |
| POST | `/clients` | Add client |
| PATCH | `/clients/:id` | Edit client |
| DELETE | `/clients/:id` | Delete client |
| GET | `/clients/:id/projects` | Projects tab |
| GET | `/clients/:id/payments` | Financial tab |
| GET | `/clients/:id/communications` | Communication tab |
| GET | `/clients/:id/documents` | Documents tab |
| GET | `/clients/:id/activity` | Activity tab |

---

## 6. Projects

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/projects?search=&status=&page=` | Projects list (grid/list view) |
| GET | `/projects/:id` | Project detail (Overview tab) |
| POST | `/projects` | Create project |
| PATCH | `/projects/:id` | Edit project / update status / progress |
| DELETE | `/projects/:id` | Delete project |
| GET | `/projects/:id/requirements` | Requirements checklist tab |
| PATCH | `/projects/:id/requirements/:reqId` | Toggle requirement done/not done |
| GET | `/projects/:id/tasks` | Tasks tab (project-scoped task list) |
| POST | `/projects/:id/tasks` | Add a task to this project |
| PATCH | `/projects/:id/tasks/:taskId` | Update task status/priority/assignee |
| DELETE | `/projects/:id/tasks/:taskId` | Remove a task |
| GET | `/projects/:id/documents` | Documents tab |
| GET | `/projects/:id/activity` | Activity tab |

---

## 7. Payments / Invoices

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/payments?search=&status=&page=` | Payments table |
| GET | `/payments/summary` | KPI cards: total revenue, paid, pending, overdue |
| GET | `/payments/:id` | Single invoice |
| POST | `/payments` | Record a payment/invoice |
| PATCH | `/payments/:id` | Edit payment / mark paid |
| DELETE | `/payments/:id` | Delete payment record |

---

## 8. Marketing

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/marketing/campaigns?search=` | Campaigns list |
| POST | `/marketing/campaigns` | Create campaign |
| PATCH | `/marketing/campaigns/:id` | Edit campaign / update spend, leads, revenue |
| DELETE | `/marketing/campaigns/:id` | Delete campaign |
| GET | `/marketing/lead-sources` | Per-channel lead volume + conversion rate |
| GET | `/marketing/analytics/trend` | Leads & spend trend (line chart data) |
| GET | `/marketing/analytics/channel-effectiveness` | Radar chart win-rate per channel |

---

## 9. Communication

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/communications?client=&type=&search=` | Timeline feed |
| POST | `/communications` | Log a call/email/message/note |
| DELETE | `/communications/:id` | Remove a log entry |

---

## 10. Documents

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/documents?search=&type=&client=&project=` | Documents grid |
| POST | `/documents` (multipart/form-data) | Upload a file |
| GET | `/documents/:id/download` | Download/stream a file |
| DELETE | `/documents/:id` | Delete a document |

---

## 11. Notifications

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/notifications` | List for bell dropdown + Notifications page |
| GET | `/notifications/unread-count` | Badge count in navbar |
| PATCH | `/notifications/:id/read` | Mark one as read |
| PATCH | `/notifications/read-all` | "Mark all as read" |

*(In production these are usually pushed via WebSocket/SSE in addition to a GET endpoint, so the bell badge updates live.)*

---

## 12. Activity Logs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/activity-logs?user=&module=&search=&page=` | Audit trail table |

Every write endpoint above (`POST`/`PATCH`/`DELETE` on leads, clients,
projects, payments, etc.) should also insert a row here server-side so this
feed stays automatically accurate — the frontend never writes to it directly.

---

## 13. Reports & Dashboard Aggregates

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/dashboard/summary` | All Dashboard KPI numbers in one call |
| GET | `/dashboard/revenue-overview` | Monthly revenue/paid/pending (area chart) |
| GET | `/dashboard/pipeline-summary` | Deal count per stage (bar chart) |
| GET | `/dashboard/lead-sources-summary` | Lead count per source (donut chart) |
| GET | `/reports/sales` | Total leads, conversion rate, won/lost, revenue |
| GET | `/reports/marketing` | Spend, revenue, ROI, leads by source |
| GET | `/reports/projects` | Active/completed/delayed counts, task completion % |
| GET | `/reports/financial` | Revenue/paid/pending/overdue + monthly breakdown |

Keeping these as dedicated aggregate endpoints (rather than making the
frontend fetch full lists and compute totals) is the main way this app will
stay fast once it's on a real database instead of in-memory mock arrays.

---

## 14. Settings

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/settings` | Load org-level preferences (language, timezone, notification toggles, company info) |
| PATCH | `/settings` | Save settings (General / Notifications / Company tabs) |

---

## Suggested response envelope

For list endpoints, wrap results consistently so `Pagination` in the frontend
can bind directly to it:

```json
{
  "data": [ /* items */ ],
  "page": 1,
  "pageSize": 6,
  "totalItems": 42,
  "totalPages": 7
}
```

## Where this plugs into the frontend

- Add these calls to a new `src/services/api.js`.
- Each page's `useState(initialX)` (seeded from `mockData.js`) becomes a
  `useEffect` fetch into that same state shape — no component code needs to
  change beyond the data-loading line, since props/rendering already match
  the mock data structure.
- `AuthContext.login()` swaps its mock lookup for `POST /auth/login`.

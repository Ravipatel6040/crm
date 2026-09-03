import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../axiosBaseQuery";

/**
 * apiSlice
 * ----------------------------------------------------------------------
 * Single RTK Query slice for the whole app. Endpoints are grouped by
 * module (mirrors API_SPEC.md 1:1) and each group declares the cache
 * `tagTypes` it owns so writes automatically invalidate + refetch the
 * right reads. Every page/dashboard should consume data through the
 * generated hooks here instead of importing mockData or hand-rolling
 * axios calls, so the whole app shares one cache + loading/error model.
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    "Auth", "User", "Lead", "Deal", "Client", "Project", "Task", "Requirement", "Payment", "Invoice", "Expense",
    "Campaign", "LeadSource", "Communication", "Document", "Notification",
    "ActivityLog", "Report", "Dashboard", "Product", "Service", "Settings",
  ],
  endpoints: (builder) => ({
    // ---------------------------------------------------------------- 1. Auth
    login: builder.mutation({
      query: (credentials) => ({ url: "/auth/login", method: "POST", data: credentials }),
      invalidatesTags: ["Auth"],
    }),
    logout: builder.mutation({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Auth"],
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", data: body }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", data: body }),
    }),
    fetchMe: builder.query({
      query: () => ({ url: "/auth/me", method: "GET" }),
      providesTags: ["Auth"],
    }),

    // ---------------------------------------------------------------- 2. Users & Team (admin account creation lives here)
    getUsers: builder.query({
      query: (params) => ({ url: "/admin/users", method: "GET", params }),
      providesTags: (result) =>
        result
          ? [...(result.data ?? result).map((u) => ({ type: "User", id: u.id })), { type: "User", id: "LIST" }]
          : [{ type: "User", id: "LIST" }],
    }),
    getUser: builder.query({
      query: (id) => ({ url: `/users/${id}`, method: "GET" }),
      providesTags: (r, e, id) => [{ type: "User", id }],
    }),
    // Admin creates BD/Sales, Marketing, Project, Finance accounts here.
    createUser: builder.mutation({
      query: (body) => ({ url: "/admin/users/create", method: "POST", data: body }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}`, method: "PATCH", data: body }),
      invalidatesTags: (r, e, { id }) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),
    // Archives the account and moves its leads/clients/projects to `reassignTo`.
    deleteUser: builder.mutation({
      query: ({ id, reassignTo = null }) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
        data: { reassignTo },
      }),
      invalidatesTags: [
        { type: "User", id: "LIST" },
        { type: "Lead", id: "LIST" },
        { type: "Client", id: "LIST" },
        { type: "Project", id: "LIST" },
        { type: "ActivityLog", id: "AUDIT" },
        "Dashboard",
      ],
    }),
    // What a user still owns — asked before archiving them.
    getUserWorkload: builder.query({
      query: (id) => ({ url: `/admin/users/${id}/workload`, method: "GET" }),
      providesTags: (r, e, id) => [{ type: "User", id: `WORKLOAD-${id}` }],
    }),
    forceLogoutUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/force-logout`, method: "POST" }),
      invalidatesTags: [{ type: "User", id: "LIST" }, { type: "ActivityLog", id: "AUDIT" }],
    }),
    changeUserPassword: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}/password`, method: "PATCH", data: body }),
      invalidatesTags: [{ type: "ActivityLog", id: "AUDIT" }],
    }),
    getUserActivity: builder.query({
      query: (id) => ({ url: `/users/${id}/activity`, method: "GET" }),
      providesTags: (r, e, id) => [{ type: "ActivityLog", id }],
    }),

    // ------------------------------------------------- 2b. Audit trail & settings
    getAuditLogs: builder.query({
      query: (params) => ({ url: "/admin/audit-logs", method: "GET", params }),
      providesTags: [{ type: "ActivityLog", id: "AUDIT" }],
    }),
    getAppSettings: builder.query({
      query: () => ({ url: "/settings", method: "GET" }),
      providesTags: [{ type: "Settings", id: "GLOBAL" }],
    }),
    updateAppSettings: builder.mutation({
      query: (body) => ({ url: "/settings", method: "PATCH", data: body }),
      invalidatesTags: [{ type: "Settings", id: "GLOBAL" }, { type: "ActivityLog", id: "AUDIT" }],
    }),
    resetAppSettings: builder.mutation({
      query: () => ({ url: "/settings/reset", method: "POST" }),
      invalidatesTags: [{ type: "Settings", id: "GLOBAL" }, { type: "ActivityLog", id: "AUDIT" }],
    }),
    getTeamPerformance: builder.query({
      query: () => ({ url: "/dashboard/team-performance", method: "GET" }),
      providesTags: ["Dashboard"],
    }),

    // ---------------------------------------------------------------- 3. Leads
    getLeads: builder.query({
      query: (params) => ({ url: "/leads", method: "GET", params }),
      providesTags: (result) =>
        result
          ? [...(result.data ?? result).map((l) => ({ type: "Lead", id: l.id })), { type: "Lead", id: "LIST" }]
          : [{ type: "Lead", id: "LIST" }],
    }),
    getLead: builder.query({
      query: (id) => ({ url: `/leads/${id}`, method: "GET" }),
      providesTags: (r, e, id) => [{ type: "Lead", id }],
    }),
    createLead: builder.mutation({
      query: (body) => ({ url: "/leads", method: "POST", data: body }),
      invalidatesTags: [{ type: "Lead", id: "LIST" }, "Dashboard"],
    }),
    updateLead: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}`, method: "PATCH", data: body }),
      invalidatesTags: (r, e, { id }) => [{ type: "Lead", id }, { type: "Lead", id: "LIST" }, "Dashboard"],
    }),
    convertLead: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/convert`, method: "POST", data: body }),
      invalidatesTags: (r, e, { id }) => [{ type: "Lead", id }, { type: "Lead", id: "LIST" }, { type: "Client", id: "LIST" }, { type: "Project", id: "LIST" }, "Dashboard", { type: "ActivityLog", id: `LEAD-${id}` }],
    }),
    assignLead: builder.mutation({
      query: ({ id, assignedTo }) => ({ url: `/leads/${id}`, method: "PATCH", data: { assignedTo } }),
      invalidatesTags: (r, e, { id }) => [{ type: "Lead", id }, { type: "Lead", id: "LIST" }],
    }),
    deleteLead: builder.mutation({
      query: (id) => ({ url: `/leads/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Lead", id: "LIST" }, "Dashboard"],
    }),
    getLeadSources: builder.query({
      query: () => ({ url: "/leads/sources", method: "GET" }),
    }),
    getLeadActivities: builder.query({
      query: (id) => ({ url: `/leads/${id}/activities`, method: "GET" }),
      providesTags: (r, e, id) => [{ type: "ActivityLog", id: `LEAD-${id}` }],
    }),
    createLeadActivity: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/activities`, method: "POST", data: body }),
      invalidatesTags: (r, e, { id }) => [{ type: "ActivityLog", id: `LEAD-${id}` }],
    }),
    updateLeadActivity: builder.mutation({
      query: ({ id, activityId, content }) => ({ url: `/leads/${id}/activities/${activityId}`, method: "PUT", data: { content } }),
      invalidatesTags: (r, e, { id }) => [{ type: "ActivityLog", id: `LEAD-${id}` }],
    }),
    deleteLeadActivity: builder.mutation({
      query: ({ id, activityId }) => ({ url: `/leads/${id}/activities/${activityId}`, method: "DELETE" }),
      invalidatesTags: (r, e, { id }) => [{ type: "ActivityLog", id: `LEAD-${id}` }],
    }),


    // ---------------------------------------------------------------- 4. Pipeline
    getDeals: builder.query({
      query: () => ({ url: "/pipeline/deals", method: "GET" }),
      providesTags: [{ type: "Deal", id: "LIST" }],
    }),
    updateDealStage: builder.mutation({
      query: ({ id, status }) => ({ url: `/pipeline/deals/${id}/stage`, method: "PATCH", data: { status } }),
      invalidatesTags: [{ type: "Deal", id: "LIST" }, { type: "Lead", id: "LIST" }],
    }),
    getPipelineStages: builder.query({
      query: () => ({ url: "/pipeline/stages", method: "GET" }),
    }),

    // ---------------------------------------------------------------- 5. Clients / Customers
    getClients: builder.query({
      query: (params) => ({ url: "/clients", method: "GET", params }),
      providesTags: (result) =>
        result
          ? [...(result.data ?? result).map((c) => ({ type: "Client", id: c.id })), { type: "Client", id: "LIST" }]
          : [{ type: "Client", id: "LIST" }],
    }),
    getClient: builder.query({
      query: (id) => ({ url: `/clients/${id}`, method: "GET" }),
      providesTags: (r, e, id) => [{ type: "Client", id }],
    }),
    createClient: builder.mutation({
      query: (body) => ({ url: "/clients", method: "POST", data: body }),
      invalidatesTags: [{ type: "Client", id: "LIST" }, "Dashboard"],
    }),
    updateClient: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/clients/${id}`, method: "PATCH", data: body }),
      invalidatesTags: (r, e, { id }) => [{ type: "Client", id }, { type: "Client", id: "LIST" }],
    }),
    deleteClient: builder.mutation({
      query: (id) => ({ url: `/clients/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Client", id: "LIST" }, "Dashboard"],
    }),

    // ---------------------------------------------------------------- 6. Projects
    getProjects: builder.query({
      query: (params) => ({ url: "/projects", method: "GET", params }),
      providesTags: (result) =>
        result
          ? [...(result.data ?? result).map((p) => ({ type: "Project", id: p.id })), { type: "Project", id: "LIST" }]
          : [{ type: "Project", id: "LIST" }],
    }),
    getProject: builder.query({
      query: (id) => ({ url: `/projects/${id}`, method: "GET" }),
      providesTags: (r, e, id) => [{ type: "Project", id }],
    }),
    createProject: builder.mutation({
      query: (body) => ({ url: "/projects", method: "POST", data: body }),
      invalidatesTags: [{ type: "Project", id: "LIST" }, "Dashboard"],
    }),
    updateProject: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: "PATCH", data: body }),
      invalidatesTags: (r, e, { id }) => [{ type: "Project", id }, { type: "Project", id: "LIST" }],
    }),
    deleteProject: builder.mutation({
      query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Project", id: "LIST" }, "Dashboard"],
    }),
    getProjectManagers: builder.query({
      query: () => ({ url: "/projects/managers", method: "GET" }),
      providesTags: [{ type: "User", id: "PM_LIST" }],
    }),
    getRequirements: builder.query({
      query: (params) => ({ url: "/projects/requirements", method: "GET", params }),
      providesTags: (result) =>
        result
          ? [...(result.data ?? result).map((r) => ({ type: "Requirement", id: r.id })), { type: "Requirement", id: "LIST" }]
          : [{ type: "Requirement", id: "LIST" }],
    }),
    createRequirement: builder.mutation({
      query: (body) => ({ url: "/projects/requirements", method: "POST", data: body }),
      invalidatesTags: [{ type: "Requirement", id: "LIST" }, "Dashboard"],
    }),
    updateRequirement: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/projects/requirements/${id}`, method: "PATCH", data: body }),
      invalidatesTags: (r, e, { id }) => [{ type: "Requirement", id }, { type: "Requirement", id: "LIST" }, "Dashboard"],
    }),
    deleteRequirement: builder.mutation({
      query: (id) => ({ url: `/projects/requirements/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Requirement", id: "LIST" }, "Dashboard"],
    }),
    getProjectTasks: builder.query({
      query: (projectId) => ({ url: `/projects/${projectId}/tasks`, method: "GET" }),
      providesTags: (r, e, projectId) => [{ type: "Task", id: `PROJECT-${projectId}` }],
    }),
    createProjectTask: builder.mutation({
      query: ({ projectId, ...body }) => ({ url: `/projects/${projectId}/tasks`, method: "POST", data: body }),
      invalidatesTags: (r, e, { projectId }) => [{ type: "Task", id: `PROJECT-${projectId}` }],
    }),
    updateProjectTask: builder.mutation({
      query: ({ projectId, taskId, ...body }) => ({ url: `/projects/${projectId}/tasks/${taskId}`, method: "PATCH", data: body }),
      invalidatesTags: (r, e, { projectId }) => [{ type: "Task", id: `PROJECT-${projectId}` }],
    }),
    deleteProjectTask: builder.mutation({
      query: ({ projectId, taskId }) => ({ url: `/projects/${projectId}/tasks/${taskId}`, method: "DELETE" }),
      invalidatesTags: (r, e, { projectId }) => [{ type: "Task", id: `PROJECT-${projectId}` }],
    }),

    // ---------------------------------------------------------------- 7. Payments / Invoices
    getPayments: builder.query({
      query: (params) => ({ url: "/payments", method: "GET", params }),
      providesTags: (result) =>
        result
          ? [...(result.data ?? result).map((p) => ({ type: "Payment", id: p.id })), { type: "Payment", id: "LIST" }]
          : [{ type: "Payment", id: "LIST" }],
    }),
    getPaymentsSummary: builder.query({
      query: () => ({ url: "/payments/summary", method: "GET" }),
      providesTags: [{ type: "Payment", id: "SUMMARY" }],
    }),
    getPayment: builder.query({
      query: (id) => ({ url: `/payments/${id}`, method: "GET" }),
      providesTags: (r, e, id) => [{ type: "Payment", id }],
    }),
    createPayment: builder.mutation({
      query: (body) => ({ url: "/payments", method: "POST", data: body }),
      invalidatesTags: [{ type: "Payment", id: "LIST" }, { type: "Payment", id: "SUMMARY" }, "Dashboard"],
    }),
    updatePayment: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/payments/${id}`, method: "PATCH", data: body }),
      invalidatesTags: [{ type: "Payment", id: "LIST" }, { type: "Payment", id: "SUMMARY" }, "Dashboard"],
    }),
    deletePayment: builder.mutation({
      query: (id) => ({ url: `/payments/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Payment", id: "LIST" }, { type: "Payment", id: "SUMMARY" }, "Dashboard"],
    }),

    // Invoices
    getInvoices: builder.query({
      query: (params) => ({ url: "/invoices", method: "GET", params }),
      providesTags: (result) =>
        result
          ? [...(result.data ?? result).map((inv) => ({ type: "Invoice", id: inv.id })), { type: "Invoice", id: "LIST" }]
          : [{ type: "Invoice", id: "LIST" }],
    }),
    getInvoice: builder.query({
      query: (id) => ({ url: `/invoices/${id}`, method: "GET" }),
      providesTags: (r, e, id) => [{ type: "Invoice", id }],
    }),
    createInvoice: builder.mutation({
      query: (body) => ({ url: "/invoices", method: "POST", data: body }),
      invalidatesTags: [{ type: "Invoice", id: "LIST" }, "Dashboard"],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/invoices/${id}`, method: "PATCH", data: body }),
      invalidatesTags: [{ type: "Invoice", id: "LIST" }, "Dashboard"],
    }),
    deleteInvoice: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Invoice", id: "LIST" }, "Dashboard"],
    }),

    // Expenses
    getExpenses: builder.query({
      query: (params) => ({ url: "/expenses", method: "GET", params }),
      providesTags: (result) =>
        result
          ? [...(result.data ?? result).map((e) => ({ type: "Expense", id: e.id })), { type: "Expense", id: "LIST" }]
          : [{ type: "Expense", id: "LIST" }],
    }),
    createExpense: builder.mutation({
      query: (body) => ({ url: "/expenses", method: "POST", data: body }),
      invalidatesTags: [{ type: "Expense", id: "LIST" }, "Dashboard"],
    }),
    updateExpense: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/expenses/${id}`, method: "PATCH", data: body }),
      invalidatesTags: [{ type: "Expense", id: "LIST" }, "Dashboard"],
    }),
    deleteExpense: builder.mutation({
      query: (id) => ({ url: `/expenses/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Expense", id: "LIST" }, "Dashboard"],
    }),

    // ---------------------------------------------------------------- 8. Marketing
    getCampaigns: builder.query({
      query: (params) => ({ url: "/marketing/campaigns", method: "GET", params }),
      providesTags: (result) => {
        const list = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
        return [...list.map((c) => ({ type: "Campaign", id: c.id || c._id })), { type: "Campaign", id: "LIST" }];
      },
    }),
    createCampaign: builder.mutation({
      query: (body) => ({ url: "/marketing/campaigns", method: "POST", data: body }),
      invalidatesTags: [{ type: "Campaign", id: "LIST" }],
    }),
    updateCampaign: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/marketing/campaigns/${id}`, method: "PATCH", data: body }),
      invalidatesTags: [{ type: "Campaign", id: "LIST" }],
    }),
    deleteCampaign: builder.mutation({
      query: (id) => ({ url: `/marketing/campaigns/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Campaign", id: "LIST" }],
    }),
    getMarketingLeadSources: builder.query({
      query: () => ({ url: "/marketing/lead-sources", method: "GET" }),
      providesTags: [{ type: "LeadSource", id: "LIST" }],
    }),
    getMarketingTrend: builder.query({
      query: () => ({ url: "/marketing/analytics/trend", method: "GET" }),
    }),
    getChannelEffectiveness: builder.query({
      query: () => ({ url: "/marketing/analytics/channel-effectiveness", method: "GET" }),
    }),

    // ---------------------------------------------------------------- 9-10. Communication & Documents
    getCommunications: builder.query({
      query: (params) => ({ url: "/communications", method: "GET", params }),
      providesTags: [{ type: "Communication", id: "LIST" }],
    }),
    createCommunication: builder.mutation({
      query: (body) => ({ url: "/communications", method: "POST", data: body }),
      invalidatesTags: [{ type: "Communication", id: "LIST" }],
    }),
    deleteCommunication: builder.mutation({
      query: (id) => ({ url: `/communications/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Communication", id: "LIST" }],
    }),
    getDocuments: builder.query({
      query: (params) => ({ url: "/documents", method: "GET", params }),
      providesTags: [{ type: "Document", id: "LIST" }],
    }),
    uploadDocument: builder.mutation({
      query: (formData) => ({ url: "/documents", method: "POST", data: formData, headers: { "Content-Type": "multipart/form-data" } }),
      invalidatesTags: [{ type: "Document", id: "LIST" }],
    }),
    deleteDocument: builder.mutation({
      query: (id) => ({ url: `/documents/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Document", id: "LIST" }],
    }),

    // ---------------------------------------------------------------- 11. Notifications
    getNotifications: builder.query({
      query: () => ({ url: "/notifications", method: "GET" }),
      providesTags: (result) => {
        const list = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];
        return [...list.map((n) => ({ type: "Notification", id: n.id ?? n._id })), { type: "Notification", id: "LIST" }];
      },
    }),
    getUnreadNotificationCount: builder.query({
      query: () => ({ url: "/notifications/unread-count", method: "GET" }),
      providesTags: [{ type: "Notification", id: "COUNT" }],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }, { type: "Notification", id: "COUNT" }],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }, { type: "Notification", id: "COUNT" }],
    }),

    // ---------------------------------------------------------------- 12. Activity logs
    getActivityLogs: builder.query({
      query: (params) => ({ url: "/activity-logs", method: "GET", params }),
      providesTags: [{ type: "ActivityLog", id: "LIST" }],
    }),

    // ---------------------------------------------------------------- 13. Reports & Dashboard aggregates
    getDashboardSummary: builder.query({
      query: () => ({ url: "/dashboard/summary", method: "GET" }),
      providesTags: ["Dashboard"],
    }),
    getSalesDashboardSummary: builder.query({
      query: () => ({ url: "/dashboard/sales-summary", method: "GET" }),
      providesTags: ["Dashboard"],
    }),
    getMarketingDashboardSummary: builder.query({
      query: () => ({ url: "/dashboard/marketing-summary", method: "GET" }),
      providesTags: ["Dashboard"],
    }),
    getProjectDashboardSummary: builder.query({
      query: () => ({ url: "/dashboard/project-summary", method: "GET" }),
      providesTags: ["Dashboard"],
    }),
    getFinanceDashboardSummary: builder.query({
      query: () => ({ url: "/dashboard/finance-summary", method: "GET" }),
      providesTags: ["Dashboard"],
    }),
    getRevenueOverview: builder.query({
      query: () => ({ url: "/dashboard/revenue-overview", method: "GET" }),
      providesTags: ["Dashboard"],
    }),
    getPipelineSummary: builder.query({
      query: () => ({ url: "/dashboard/pipeline-summary", method: "GET" }),
      providesTags: ["Dashboard"],
    }),
    getLeadSourcesSummary: builder.query({
      query: () => ({ url: "/dashboard/lead-sources-summary", method: "GET" }),
      providesTags: ["Dashboard"],
    }),
    getSalesReport: builder.query({
      query: () => ({ url: "/reports/sales", method: "GET" }),
      providesTags: [{ type: "Report", id: "SALES" }],
    }),
    getMarketingReport: builder.query({
      query: () => ({ url: "/reports/marketing", method: "GET" }),
      providesTags: [{ type: "Report", id: "MARKETING" }],
    }),
    getProjectsReport: builder.query({
      query: () => ({ url: "/reports/projects", method: "GET" }),
      providesTags: [{ type: "Report", id: "PROJECTS" }],
    }),
    getFinancialReport: builder.query({
      query: () => ({ url: "/reports/financial", method: "GET" }),
      providesTags: [{ type: "Report", id: "FINANCIAL" }],
    }),

    // ---------------------------------------------------------------- Catalog: Products & Services
    getProducts: builder.query({
      query: (params) => ({ url: "/products", method: "GET", params }),
      providesTags: (result) =>
        result ? [...result.map((p) => ({ type: "Product", id: p.id })), { type: "Product", id: "LIST" }] : [{ type: "Product", id: "LIST" }],
    }),
    createProduct: builder.mutation({
      query: (body) => ({ url: "/products", method: "POST", data: body }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: "PATCH", data: body }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    getServices: builder.query({
      query: (params) => ({ url: "/services", method: "GET", params }),
      providesTags: (result) =>
        result ? [...result.map((s) => ({ type: "Service", id: s.id })), { type: "Service", id: "LIST" }] : [{ type: "Service", id: "LIST" }],
    }),
    createService: builder.mutation({
      query: (body) => ({ url: "/services", method: "POST", data: body }),
      invalidatesTags: [{ type: "Service", id: "LIST" }],
    }),
    updateService: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/services/${id}`, method: "PATCH", data: body }),
      invalidatesTags: [{ type: "Service", id: "LIST" }],
    }),
    deleteService: builder.mutation({
      query: (id) => ({ url: `/services/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Service", id: "LIST" }],
    }),

    // ---------------------------------------------------------------- 14. Settings
    getSettings: builder.query({
      query: () => ({ url: "/settings", method: "GET" }),
      providesTags: ["Settings"],
    }),
    updateSettings: builder.mutation({
      query: (body) => ({ url: "/settings", method: "PATCH", data: body }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useLoginMutation, useLogoutMutation, useForgotPasswordMutation, useResetPasswordMutation, useFetchMeQuery, useLazyFetchMeQuery,
  useGetUsersQuery, useGetUserQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation, useChangeUserPasswordMutation, useGetUserActivityQuery,
  useGetUserWorkloadQuery, useForceLogoutUserMutation,
  useGetAuditLogsQuery, useGetAppSettingsQuery, useUpdateAppSettingsMutation, useResetAppSettingsMutation, useGetTeamPerformanceQuery,
  useGetLeadsQuery, useGetLeadQuery, useCreateLeadMutation, useUpdateLeadMutation, useAssignLeadMutation, useDeleteLeadMutation, useConvertLeadMutation, useGetLeadSourcesQuery, useGetLeadActivitiesQuery, useCreateLeadActivityMutation, useUpdateLeadActivityMutation, useDeleteLeadActivityMutation,
  useGetDealsQuery, useUpdateDealStageMutation, useGetPipelineStagesQuery,
  useGetClientsQuery, useGetClientQuery, useCreateClientMutation, useUpdateClientMutation, useDeleteClientMutation,
  useGetProjectsQuery, useGetProjectQuery, useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation,
  useGetProjectManagersQuery,
  useGetRequirementsQuery, useCreateRequirementMutation, useUpdateRequirementMutation, useDeleteRequirementMutation,
  useGetProjectTasksQuery, useCreateProjectTaskMutation, useUpdateProjectTaskMutation, useDeleteProjectTaskMutation,
  useGetPaymentsQuery, useGetPaymentsSummaryQuery, useGetPaymentQuery, useCreatePaymentMutation, useUpdatePaymentMutation, useDeletePaymentMutation,
  useGetInvoicesQuery, useGetInvoiceQuery, useCreateInvoiceMutation, useUpdateInvoiceMutation, useDeleteInvoiceMutation,
  useGetExpensesQuery, useCreateExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation,
  useGetCampaignsQuery, useCreateCampaignMutation, useUpdateCampaignMutation, useDeleteCampaignMutation,
  useGetMarketingLeadSourcesQuery, useGetMarketingTrendQuery, useGetChannelEffectivenessQuery,
  useGetCommunicationsQuery, useCreateCommunicationMutation, useDeleteCommunicationMutation,
  useGetDocumentsQuery, useUploadDocumentMutation, useDeleteDocumentMutation,
  useGetNotificationsQuery, useGetUnreadNotificationCountQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation,
  useGetActivityLogsQuery,
  useGetDashboardSummaryQuery, useGetSalesDashboardSummaryQuery, useGetMarketingDashboardSummaryQuery, useGetProjectDashboardSummaryQuery, useGetFinanceDashboardSummaryQuery, useGetRevenueOverviewQuery, useGetPipelineSummaryQuery, useGetLeadSourcesSummaryQuery,
  useGetSalesReportQuery, useGetMarketingReportQuery, useGetProjectsReportQuery, useGetFinancialReportQuery,
  useGetProductsQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation,
  useGetServicesQuery, useCreateServiceMutation, useUpdateServiceMutation, useDeleteServiceMutation,
  useGetSettingsQuery, useUpdateSettingsMutation,
} = apiSlice;

export default apiSlice;

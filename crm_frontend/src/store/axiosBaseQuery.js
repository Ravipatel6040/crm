import api from "../services/api";

/**
 * axiosBaseQuery
 * ----------------------------------------------------------------------
 * RTK Query needs a `baseQuery` function. Rather than introducing a second
 * HTTP client (fetchBaseQuery) alongside the axios instance already wired
 * up in `services/api.js` (baseURL, withCredentials, auth-token
 * interceptor), we adapt axios itself into a baseQuery. This keeps a
 * single source of truth for how requests reach the backend.
 *
 * Usage inside createApi:
 *   baseQuery: axiosBaseQuery()
 *
 * Endpoint definition example:
 *   getLeads: builder.query({ query: (params) => ({ url: "/leads", method: "GET", params }) })
 */
export function axiosBaseQuery() {
  return async ({ url, method = "GET", data, params, headers }) => {
    try {
      // The shared axios instance defaults every request to
      // Content-Type: application/json. A FormData body (file uploads)
      // needs its own multipart boundary instead — clearing the header lets
      // axios/the browser set the correct one automatically.
      const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
      const result = await api({
        url,
        method,
        data,
        params,
        headers: isFormData ? { ...headers, "Content-Type": undefined } : headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError;
      return {
        error: {
          status: err.response?.status ?? "FETCH_ERROR",
          data: err.response?.data ?? err.message,
        },
      };
    }
  };
}

export default axiosBaseQuery;

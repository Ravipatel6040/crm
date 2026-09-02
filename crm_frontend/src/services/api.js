import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Attach Access Token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Mutex & Queue for Seamless Token Refresh ──────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Skip refresh for auth endpoints to prevent infinite retry loops
    const isAuthEndpoint =
      originalRequest.url?.includes('/login') ||
      originalRequest.url?.includes('/refresh') ||
      originalRequest.url?.includes('/logout');

    if (isAuthEndpoint || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request until the refresh finishes
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (!storedRefreshToken) {
      processQueue(error, null);
      isRefreshing = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('crm_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(error);
    }

    try {
      // Use clean standalone axios instance to bypass interceptor
      let refreshRes;
      try {
        refreshRes = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );
      } catch (err) {
        // Fallback to role-specific refresh endpoint if /auth/refresh fails
        const user = JSON.parse(localStorage.getItem('crm_user') || '{}');
        const fallbackUrl =
          user.role === 'ADMIN'
            ? `${BASE_URL}/admin/refresh`
            : `${BASE_URL}/users/refresh`;

        refreshRes = await axios.post(
          fallbackUrl,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );
      }

      const resData = refreshRes.data?.data || refreshRes.data || {};
      const newAccessToken = resData.accessToken;
      const newRefreshToken = resData.refreshToken;

      if (!newAccessToken) {
        throw new Error('No access token returned from refresh service');
      }

      // Update storage
      localStorage.setItem('accessToken', newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      // Update default headers
      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Notify Redux and listeners
      window.dispatchEvent(
        new CustomEvent('auth:token-refreshed', {
          detail: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
        })
      );

      processQueue(null, newAccessToken);
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('crm_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

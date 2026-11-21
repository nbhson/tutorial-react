import axios from "axios";

export const http = axios.create({ baseURL: "/api", timeout: 15_000 });

// "Request interceptor" — tương đương chain request Angular (gắn token/log):
http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("access_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// "Response interceptor" — tương đương chain response (401 → refresh, unwrap):
http.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retried) {
      err.config._retried = true;
      await refreshOnce();              // single-flight (§4)
      return http(err.config);          // retry request gốc
    }
    return Promise.reject(err);         // Query/UI xử lý (onError)
  },
);

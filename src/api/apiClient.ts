import axios, { AxiosError, type AxiosRequestConfig, type AxiosInstance } from "axios";

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});


let isRefreshing = false;

interface FailedQueueItem {
  resolve: (value?: string) => void; // aceita string
  reject: (error: unknown) => void;
}

let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token); // só resolve se tiver token
    else reject(new Error("No token available"));
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Se não for 401 ou já tentou refresh, rejeita
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Marca que já tentamos
    originalRequest._retry = true;

    if (isRefreshing) {
      // Espera o refresh terminar
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (token && originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const { data } = await apiClient.post<Tokens>("/api/v1/auth/refresh", {}); // usa mesma instância

      // Atualiza header do original
      if (originalRequest.headers) {
        originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;
      }

      processQueue(null, data.accessToken);
      return apiClient(originalRequest);
    } catch (err) {
      processQueue(err as AxiosError, null);
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;

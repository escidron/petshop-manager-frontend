import axios, { type AxiosError, type AxiosRequestConfig, type AxiosInstance } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Instância separada para o refresh — SEM interceptor de resposta,
// para evitar loop infinito quando o refresh também retorna 401.
const refreshClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Endpoints de autenticação que NÃO devem acionar o refresh
const AUTH_ENDPOINTS = ["/api/v1/auth/refresh", "/api/v1/auth/login", "/api/v1/auth/logout", "/api/v1/auth/signup"];

const isAuthEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((ep) => url.includes(ep));
};

let isRefreshing = false;

interface FailedQueueItem {
  resolve: () => void;
  reject: (error: unknown) => void;
}

let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Se não for 401, ou já tentamos refresh, ou é um endpoint de auth → rejeita direto
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    // Marca que já tentamos refresh para esta request
    originalRequest._retry = true;

    if (isRefreshing) {
      // Outra request já está fazendo refresh → espera na fila
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        // Refresh deu certo → reenvia a request original (cookie já foi atualizado)
        return apiClient(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      // Usa refreshClient (sem interceptor) para evitar loop
      await refreshClient.post("/api/v1/auth/refresh", {});

      // Refresh OK → libera fila e reenvia a request original
      processQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh falhou → rejeita tudo e redireciona para login
      processQueue(refreshError as AxiosError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;


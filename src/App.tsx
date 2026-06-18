import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import ToastProvider from "./components/Toast/ToastProvider";
import { AuthProvider } from "./features/users/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
import { useToast } from "./hooks/useToast";

function GlobalErrorHandler() {
  const toast = useToast();

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      const msg = event.reason?.message || event.reason || "Erro em segundo plano inesperado.";
      // Evita poluir toasts com erros comuns de refresh do WAF
      if (typeof msg === "string" && !msg.toLowerCase().includes("refresh") && !msg.toLowerCase().includes("401")) {
        toast.error(`Erro: ${msg}`);
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [toast]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <GlobalErrorHandler />
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

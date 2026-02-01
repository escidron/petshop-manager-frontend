import { useContext } from "react";
import { ToastContext } from "../components/Toast/ToastProvider";

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return {
    success: (msg: string) => context.show(msg, "success"),
    error: (msg: string) => context.show(msg, "error"),
    warning: (msg: string) => context.show(msg, "warning"),
    info: (msg: string) => context.show(msg, "info"),
  };
}

import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import axios from "axios";
import { Box, Typography, Paper, Collapse } from "@mui/material";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../Button/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface FallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  onGoHome: () => void;
}

function ErrorBoundaryFallback({ error, errorInfo, onReset, onGoHome }: FallbackProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        p: 3,
        width: "100%",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: "100%",
          borderRadius: 4,
          textAlign: "center",
          border: "1px solid",
          borderColor: "divider",
          background: "background.paper",
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            p: 2,
            borderRadius: "50%",
            bgcolor: "error.lighter",
            color: "error.main",
            mb: 2,
          }}
        >
          <AlertTriangle size={40} />
        </Box>

        <Typography variant="h5" fontWeight={800} color="text.primary" gutterBottom>
          Algo deu errado
        </Typography>

        <Typography variant="body2" color="text.primary" sx={{ mb: 3 }}>
          Ocorreu um erro inesperado ao carregar esta seção. Nosso time técnico já foi notificado.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 3 }}>
          <Button
            variant="contained"
            onClick={onReset}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <RefreshCw size={16} />
            Recarregar Página
          </Button>
          <Button
            variant="outlined"
            onClick={onGoHome}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Home size={16} />
            Ir para o Início
          </Button>
        </Box>

        {error && import.meta.env.DEV && (
          <Box sx={{ textAlign: "left", mt: 2 }}>
            <Box
              onClick={() => setShowDetails((prev) => !prev)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyPosition: "space-between",
                justifyContent: "space-between",
                cursor: "pointer",
                py: 1,
                px: 1.5,
                bgcolor: "action.hover",
                borderRadius: 2,
                userSelect: "none",
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.primary">
                Detalhes técnicos do erro
              </Typography>
              <Box sx={{ display: "flex", color: "text.primary" }}>
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Box>
            </Box>
            <Collapse in={showDetails}>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  mt: 1,
                  bgcolor: "grey.900",
                  color: "error.light",
                  borderRadius: 2,
                  fontSize: "0.75rem",
                  overflowX: "auto",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  maxHeight: 200,
                }}
              >
                {error.toString()}
                {errorInfo?.componentStack}
              </Box>
            </Collapse>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error captured by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
      axios.post(
        `${BASE_URL}/api/v1/observability/client-error`,
        {
          message: error.message || error.toString(),
          stack: `${error.stack || ""}\nComponent Stack:\n${errorInfo.componentStack || ""}`,
          url: window.location.href,
          user_agent: navigator.userAgent,
        },
        { withCredentials: true }
      ).catch((err) => {
        console.error("Failed to send client error telemetry to backend:", err);
      });
    } catch (e) {
      console.error("Error during telemetry dispatch:", e);
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorBoundaryFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

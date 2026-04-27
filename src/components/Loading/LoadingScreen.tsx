import { Box, Typography, keyframes } from "@mui/material";

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
`;

const LoadingScreen = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#F8FAFC",
      }}
    >
      <Box
        sx={{
          color: "#313485",
          mb: 3,
          animation: `${pulse} 1.5s ease-in-out infinite`,
          display: "flex",
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="80" height="80">
          <circle cx="12" cy="16" r="4" />
          <circle cx="6" cy="11" r="2.5" />
          <circle cx="18" cy="11" r="2.5" />
          <circle cx="9" cy="5" r="2.5" />
          <circle cx="15" cy="5" r="2.5" />
        </svg>
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: "#313485",
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        Verificando autenticação...
      </Typography>
    </Box>
  );
};

export default LoadingScreen;

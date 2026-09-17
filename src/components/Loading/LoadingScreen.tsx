import { Box, Typography, keyframes } from "@mui/material";

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.95;
    filter: drop-shadow(0 6px 16px rgba(49, 52, 133, 0.12));
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
    filter: drop-shadow(0 12px 28px rgba(49, 52, 133, 0.22));
  }
`;

const slide = keyframes`
  0% { left: -45%; }
  100% { left: 100%; }
`;

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = "Preparando tudo para você..." }: LoadingScreenProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        width: "100vw",
        backgroundColor: "#F8FAFC",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <Box
        component="img"
        src="/logo.png"
        alt="Data Pet"
        sx={{
          width: 120,
          maxWidth: "80vw",
          height: "auto",
          mb: 2.5,
          animation: `${pulse} 2s ease-in-out infinite`,
          display: "block",
          objectFit: "contain",
        }}
      />
      <Typography
        variant="h6"
        sx={{
          color: "#313485",
          fontWeight: 700,
          fontSize: "1.15rem",
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}
      >
        {message}
      </Typography>

      <Box
        sx={{
          width: 140,
          height: 4,
          bgcolor: "rgba(49, 52, 133, 0.08)",
          borderRadius: 99,
          mt: 2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "45%",
            background: "linear-gradient(90deg, #313485, #FF751F)",
            borderRadius: 99,
            animation: `${slide} 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
          }}
        />
      </Box>
    </Box>
  );
};

export default LoadingScreen;


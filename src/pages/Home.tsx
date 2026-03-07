import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import Dashboard from "./Dashboard";
import OnboardingFlow from "./OnboardingPage";

const Home = () => {
  const { tenant, checking } = useAuth();

  if (checking) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!tenant) {
    return null; 
  }

  if (tenant.onboarding_step !== "completed") {
    return <OnboardingFlow />;
  }

  return <Dashboard />;
};

export default Home;

import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import Dashboard from "./Dashboard";

const Home = () => {
  const { checking } = useAuth();

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
  return <Dashboard />;
};

export default Home;

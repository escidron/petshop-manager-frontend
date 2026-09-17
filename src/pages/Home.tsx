import { useAuth } from "../hooks/useAuth";
import Dashboard from "./Dashboard";
import LoadingScreen from "../components/Loading/LoadingScreen";

const Home = () => {
  const { checking } = useAuth();

  if (checking) {
    return <LoadingScreen />;
  }
  return <Dashboard />;
};

export default Home;

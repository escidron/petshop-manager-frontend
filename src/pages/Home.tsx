import { useAuth } from "../hooks/useAuth";
import Dashboard from "./Dashboard";
import OnboardingFlow from "./OnboardingPage";

const Home = () => {
  const { tenant,checking } = useAuth(); // vindo do /me

  if (checking) return null; // ou loader

  if (tenant?.onboarding_step !== "completed") {
    return <OnboardingFlow />;
  }

  return <Dashboard />;
};

export default Home;
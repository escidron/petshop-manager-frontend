import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import ClientsPage from "./pages/ClientsPage";
import RegistrationLayout from "./layouts/RegistrationLayout";
import ClientDetailsPage from "./pages/ClientDetailsPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Layout principal */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />

        {/* REGISTRATION */}
        <Route path="registration" element={<RegistrationLayout />}>
          <Route path="clients">
            <Route index element={<ClientsPage />} />
            <Route path=":id" element={<ClientDetailsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Clients from "./pages/ClientsPage";
import RegistrationLayout from "./layouts/RegistrationLayout";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Layout principal */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />

        {/* REGISTRATION */}
        <Route path="registration" element={<RegistrationLayout />}>
          <Route path="clients" element={<Clients />} />
          {/* <Route path="pets" element={<Pets />} /> */}
        </Route>
      </Route>
    </Routes>
  );
}

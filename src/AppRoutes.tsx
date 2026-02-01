import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ClientsPage from "./pages/ClientsPage";
import RegistrationLayout from "./layouts/RegistrationLayout";
import ClientDetailsPage from "./pages/ClientDetailsPage";
import Dashboard from "./pages/Dashboard";
import PetsPage from "./pages/PetsPage";
import ProductsPage from "./pages/ProductsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="registration" element={<RegistrationLayout />}>
          <Route path="clients">
            <Route index element={<ClientsPage />} />
            <Route path=":id" element={<ClientDetailsPage />} />
          </Route>
          <Route path="pets">
            <Route index element={<PetsPage />} />
            <Route path=":id" element={<ClientDetailsPage />} />
          </Route>
          <Route path="products">
            <Route index element={<ProductsPage />} />
            {/* <Route path=":id" element={<ClientDetailsPage />} /> */}
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ClientsPage from "./pages/ClientsPage";
import RegistrationLayout from "./layouts/RegistrationLayout";
import ClientDetailsPage from "./pages/ClientDetailsPage";
import PetsPage from "./pages/PetsPage";
import ProductsPage from "./pages/ProductsPage";
import SignupPage from "./pages/SignupPage";
import ServicesPage from "./pages/ServicesPage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./hooks/useAuth";
import type { JSX } from "react";
import Home from "./pages/Home";
import FinancialPage from "./pages/FinancialPage";
import LandingPage from "./pages/LandingPage";
import SettingsPage from "./pages/SettingsPage";
import PackagesPage from "./pages/PackagesPage";
import POSPage from "./pages/POSPage";
import InventoryPage from "./pages/InventoryPage";
import SuppliersPage from "./pages/SuppliersPage";
import EmployeesPage from "./pages/EmployeesPage";
import CommissionRulesPage from "./pages/CommissionRulesPage";
import CommissionReportPage from "./pages/CommissionReportPage";
import ReportsPage from "./pages/ReportsPage";
import FinancialReportPage from "./pages/FinancialReportPage";
import InventoryReportPage from "./pages/InventoryReportPage";

type Props = {
  children: JSX.Element;
};

export const ProtectedRoute = ({ children }: Props) => {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return children;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export const OwnerRoute = ({ children }: Props) => {
  const { user, checking } = useAuth();

  if (checking) return children;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "owner") return <Navigate to="/dashboard" replace />;

  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Home />} />
        <Route path="/financial" element={<FinancialPage />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
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
          </Route>
          <Route path="suppliers">
            <Route index element={<SuppliersPage />} />
          </Route>
          <Route path="services">
            <Route index element={<ServicesPage />} />
          </Route>
          <Route path="packages">
            <Route index element={<PackagesPage />} />
          </Route>
          <Route path="employees">
            <Route index element={<EmployeesPage />} />
          </Route>
        </Route>
        <Route path="/commissions">
          <Route path="rules" element={<OwnerRoute><CommissionRulesPage /></OwnerRoute>} />
          <Route path="report" element={<OwnerRoute><CommissionReportPage /></OwnerRoute>} />
        </Route>
        <Route path="/reports" element={<OwnerRoute><ReportsPage /></OwnerRoute>} />
        <Route path="/reports/financial" element={<OwnerRoute><FinancialReportPage /></OwnerRoute>} />
        <Route path="/reports/inventory" element={<OwnerRoute><InventoryReportPage /></OwnerRoute>} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      {/* Fallback para evitar 404 em rotas não encontradas ou redirecionar para a landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

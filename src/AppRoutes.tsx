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
import LandingPage from "./pages/LandingPage";
import SettingsPage from "./pages/SettingsPage";
import PackagesPage from "./pages/PackagesPage";
import POSPage from "./pages/POSPage";
import InventoryPage from "./pages/InventoryPage";
import SuppliersPage from "./pages/SuppliersPage";
import EmployeesPage from "./pages/EmployeesPage";
import CommissionRulesPage from "./pages/CommissionRulesPage";
import ReportsPage from "./pages/ReportsPage";
import LoadingScreen from "./components/Loading/LoadingScreen";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SelectTenantPage from "./pages/SelectTenantPage";
import SharedSchedulePage from "./pages/SharedSchedulePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import PublicBookingPage from "./pages/PublicBookingPage";
import DREReportPage from "./pages/DREReportPage";
import OperationalResultPage from "./pages/OperationalResultPage";
import FinancialBillsPage from "./pages/FinancialBillsPage";
import DaycarePage from "./pages/DaycarePage";

import { usePermission } from "./hooks/usePermission";

type Props = {
  children: JSX.Element;
};

type PermissionProps = {
  module: string;
  children: JSX.Element;
};

export const ProtectedRoute = ({ children }: Props) => {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking && !user) {
    return <LoadingScreen />;
  }

  // If no user and finished checking -> redirect
  if (!checking && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export const PermissionRoute = ({ module, children }: PermissionProps) => {
  const { user, checking } = useAuth();
  const { hasPermission } = usePermission();

  if (checking && !user) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasPermission(module)) return <Navigate to="/dashboard" replace />;

  return children;
};

export const OwnerRoute = ({ children }: Props) => {
  const { user, checking } = useAuth();

  if (checking && !user) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "owner" && user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
};

export const AdminRoute = ({ children }: Props) => {
  const { user, checking } = useAuth();

  if (checking && !user) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/select-tenant" element={<SelectTenantPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<PermissionRoute module="dashboard"><Home /></PermissionRoute>} />
        <Route path="/creche" element={<PermissionRoute module="daycare"><DaycarePage /></PermissionRoute>} />
        <Route path="/daycare" element={<PermissionRoute module="daycare"><DaycarePage /></PermissionRoute>} />
        <Route path="/financial" element={<Navigate to="/reports?category=vendas&subtab=extrato" replace />} />
        <Route path="/pos" element={<PermissionRoute module="pos"><POSPage /></PermissionRoute>} />
        <Route path="/inventory" element={<PermissionRoute module="inventory"><InventoryPage /></PermissionRoute>} />
        <Route path="registration" element={<RegistrationLayout />}>
          <Route path="clients">
            <Route index element={<PermissionRoute module="clients"><ClientsPage /></PermissionRoute>} />
            <Route path=":id" element={<PermissionRoute module="clients"><ClientDetailsPage /></PermissionRoute>} />
          </Route>
          <Route path="pets">
            <Route index element={<PermissionRoute module="pets"><PetsPage /></PermissionRoute>} />
            <Route path=":id" element={<PermissionRoute module="pets"><ClientDetailsPage /></PermissionRoute>} />
          </Route>
          <Route path="products">
            <Route index element={<PermissionRoute module="products"><ProductsPage /></PermissionRoute>} />
          </Route>
          <Route path="suppliers">
            <Route index element={<PermissionRoute module="suppliers"><SuppliersPage /></PermissionRoute>} />
          </Route>
          <Route path="services">
            <Route index element={<PermissionRoute module="services"><ServicesPage /></PermissionRoute>} />
          </Route>
          <Route path="packages">
            <Route index element={<PermissionRoute module="packages"><PackagesPage /></PermissionRoute>} />
          </Route>
          <Route path="employees">
            <Route index element={<PermissionRoute module="employees"><EmployeesPage /></PermissionRoute>} />
          </Route>
        </Route>
        <Route path="/commissions">
          <Route path="rules" element={<PermissionRoute module="commissions"><CommissionRulesPage /></PermissionRoute>} />
          <Route path="report" element={<Navigate to="/reports?category=vendas&subtab=comissoes" replace />} />
        </Route>
        <Route path="/reports" element={<PermissionRoute module="reports"><ReportsPage /></PermissionRoute>} />
        <Route path="/reports/financial" element={<Navigate to="/reports?category=vendas&subtab=extrato" replace />} />
        <Route path="/reports/inventory" element={<Navigate to="/reports?category=estoque" replace />} />
        <Route
          path="/managerial/bills"
          element={
            <PermissionRoute module="financial-bills">
              <FinancialBillsPage />
            </PermissionRoute>
          }
        />
        <Route path="/financial/bills" element={<Navigate to="/managerial/bills" replace />} />
        <Route
          path="/managerial/dre"
          element={
            <PermissionRoute module="dre">
              <DREReportPage />
            </PermissionRoute>
          }
        />
        <Route path="/financial/dre" element={<Navigate to="/managerial/dre" replace />} />
        <Route
          path="/managerial/operational-result"
          element={
            <PermissionRoute module="operational-result">
              <OperationalResultPage />
            </PermissionRoute>
          }
        />
        <Route path="/financial/operational-result" element={<Navigate to="/managerial/operational-result" replace />} />
        <Route path="/settings" element={<PermissionRoute module="settings"><SettingsPage /></PermissionRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      </Route>
      <Route path="/shared-schedule/:token" element={<SharedSchedulePage />} />
      <Route path="/book/:token" element={<PublicBookingPage />} />
      {/* Fallback para evitar 404 em rotas não encontradas ou redirecionar para a landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

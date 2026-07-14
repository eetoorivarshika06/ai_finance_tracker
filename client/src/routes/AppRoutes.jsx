import { Routes, Route } from "react-router-dom";
import { ROUTES } from "./paths";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";
import RootRedirect from "../components/RootRedirect";
import MainLayout from "../layouts/MainLayout";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Analytics from "../pages/Analytics";
import Transactions from "../pages/Transactions";
import Budget from "../pages/Budget";
import Insights from "../pages/Insights";
import Chat from "../pages/Chat";
import Reports from "../pages/Reports";
import Profile from "../pages/Profile";

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes — redirect to dashboard if already logged in */}
      <Route element={<PublicRoute />}>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.SIGNUP} element={<Signup />} />
      </Route>

      {/* Protected routes — require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.ANALYTICS} element={<Analytics />} />
          <Route path={ROUTES.TRANSACTIONS} element={<Transactions />} />
          <Route path={ROUTES.BUDGET} element={<Budget />} />
          <Route path={ROUTES.INSIGHTS} element={<Insights />} />
          <Route path={ROUTES.CHAT} element={<Chat />} />
          <Route path={ROUTES.REPORTS} element={<Reports />} />
          <Route path={ROUTES.PROFILE} element={<Profile />} />
        </Route>
      </Route>

      {/* Root and unknown paths */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default AppRoutes;

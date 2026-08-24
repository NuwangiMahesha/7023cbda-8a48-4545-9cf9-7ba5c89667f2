import React from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation } from
'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from './contexts/AppContext';
import { AppShell } from './components/layout/AppShell';
import { AdminLayout } from './components/admin/AdminLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Menu } from './pages/Menu';
import { WinGo } from './pages/WinGo';
import { Wallet } from './pages/Wallet';
import { Trend } from './pages/Trend';
import { Promotion } from './pages/Promotion';
import { Recharge } from './pages/Recharge';
import { Withdrawal } from './pages/Withdrawal';
import { Transactions } from './pages/Transactions';
import { ResetPassword } from './pages/ResetPassword';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminRequests } from './pages/admin/AdminRequests';
import { AdminGameControl } from './pages/admin/AdminGameControl';
import { AdminSettings } from './pages/admin/AdminSettings';

function RequirePlayer() {
  const { user } = useApp();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

function RequireAdmin() {
  const { isAdmin } = useApp();
  if (!isAdmin) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

function GuestOnly() {
  const { user } = useApp();
  if (user) return <Navigate to="/win" replace />;
  return <Outlet />;
}

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/win" replace />} />

          <Route element={<GuestOnly />}>
            <Route element={<AppShell showNav={false} />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
          </Route>

          <Route element={<RequirePlayer />}>
            <Route element={<AppShell />}>
              <Route path="/menu" element={<Menu />} />
              <Route path="/win" element={<WinGo />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/trend" element={<Trend />} />
              <Route path="/promotion" element={<Promotion />} />
            </Route>
            <Route element={<AppShell showNav={false} />}>
              <Route path="/wallet/recharge" element={<Recharge />} />
              <Route path="/wallet/withdrawal" element={<Withdrawal />} />
              <Route path="/wallet/transactions" element={<Transactions />} />
              <Route path="/wallet/reset-password" element={<ResetPassword />} />
            </Route>
          </Route>

          <Route path="/admin" element={<AdminLogin />} />
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/requests" element={<AdminRequests />} />
              <Route path="/admin/game" element={<AdminGameControl />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/win" replace />} />
        </Routes>
        <Toaster position="top-center" richColors closeButton />
      </BrowserRouter>
    </AppProvider>);

}
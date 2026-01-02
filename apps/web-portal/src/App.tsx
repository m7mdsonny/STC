import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isSuperAdmin, canManageOrganization, normalizeRole } from './lib/rbac';
import { Layout } from './components/layout/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Automation } from './pages/Automation';
import { Cameras } from './pages/Cameras';
import { Alerts } from './pages/Alerts';
import { Analytics } from './pages/Analytics';
import { People } from './pages/People';
import { Vehicles } from './pages/Vehicles';
import { Attendance } from './pages/Attendance';
import { LiveView } from './pages/LiveView';
import { Market } from './pages/Market';
import { Settings } from './pages/Settings';
import { Team } from './pages/Team';
import { OwnerGuide } from './pages/OwnerGuide';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Organizations } from './pages/admin/Organizations';
import { Users } from './pages/admin/Users';
import { Licenses } from './pages/admin/Licenses';
import { Plans } from './pages/admin/Plans';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminSettings } from './pages/admin/AdminSettings';
import { LandingSettingsPage } from './pages/admin/LandingSettings';
import { AdminIntegrations } from './pages/admin/AdminIntegrations';
import { AdminSmsSettings } from './pages/admin/AdminSmsSettings';
import { AdminUpdates } from './pages/admin/AdminUpdates';
import { SystemUpdates } from './pages/admin/SystemUpdates';
import { AdminBackups } from './pages/admin/AdminBackups';
import { AiCommandCenter } from './pages/admin/AiCommandCenter';
import { AIModulesAdmin } from './pages/admin/AIModulesAdmin';
import { ModelTraining } from './pages/admin/ModelTraining';
import { SuperAdminManagement } from './pages/admin/SuperAdminManagement';
import { SuperAdminSettings } from './pages/admin/SuperAdminSettings';
import { PlatformWordings } from './pages/admin/PlatformWordings';
import { EdgeServers } from './pages/admin/EdgeServers';
import { Resellers } from './pages/admin/Resellers';
import { SystemMonitor } from './pages/admin/SystemMonitor';
import { Loader2 } from 'lucide-react';
import { BrandingProvider } from './contexts/BrandingContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { ToastContainer } from './components/ui/Toast';

function PrivateRoute({ 
  children, 
  adminOnly = false,
  requireManage = false,
}: { 
  children: React.ReactNode; 
  adminOnly?: boolean;
  requireManage?: boolean;
}) {
  const { user, profile, loading, isSuperAdmin: isSuperAdminFlag } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-stc-bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stc-gold animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = normalizeRole(profile?.role);
  const isSuperAdminUser = isSuperAdmin(userRole, profile?.is_super_admin);

  // Super admin only routes
  if (adminOnly && !isSuperAdminUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Routes requiring manage permissions (owner or admin)
  if (requireManage && !isSuperAdminUser && !canManageOrganization(userRole)) {
    return (
      <div className="min-h-screen bg-stc-bg-dark flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">غير مصرح</h2>
          <p className="text-white/60">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-stc-bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stc-gold animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={isSuperAdmin ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}

function AppRoutesWithToast() {
  const { toasts, removeToast } = useToast();
  
  return (
    <>
      <Routes>
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        } 
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      <Route
        element={
          <PrivateRoute adminOnly>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/monitor" element={<SystemMonitor />} />
        <Route path="/admin/organizations" element={<Organizations />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/licenses" element={<Licenses />} />
        <Route path="/admin/edge-servers" element={<EdgeServers />} />
        <Route path="/admin/resellers" element={<Resellers />} />
        <Route path="/admin/plans" element={<Plans />} />
        <Route path="/admin/ai-modules" element={<AIModulesAdmin />} />
        <Route path="/admin/model-training" element={<ModelTraining />} />
        <Route path="/admin/integrations" element={<AdminIntegrations />} />
        <Route path="/admin/sms" element={<AdminSmsSettings />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/super-admins" element={<SuperAdminManagement />} />
        <Route path="/admin/super-settings" element={<SuperAdminSettings />} />
        <Route path="/admin/wordings" element={<PlatformWordings />} />
        <Route path="/admin/landing" element={<LandingSettingsPage />} />
        <Route path="/admin/updates" element={<AdminUpdates />} />
        <Route path="/admin/system-updates" element={<SystemUpdates />} />
        <Route path="/admin/backups" element={<AdminBackups />} />
        <Route path="/admin/ai-commands" element={<AiCommandCenter />} />
      </Route>

      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/live" element={<LiveView />} />
        <Route path="/cameras" element={<Cameras />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/people" element={<People />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/market" element={<Market />} />
        <Route path="/automation" element={<Automation />} />
        <Route 
          path="/team" 
          element={
            <PrivateRoute requireManage>
              <Team />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/guide" 
          element={
            <PrivateRoute>
              <OwnerGuide />
            </PrivateRoute>
          } 
        />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

function AppRoutes() {
  return <AppRoutesWithToast />;
}

export default function App() {
  return (
    <BrowserRouter>
      <BrandingProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </BrandingProvider>
    </BrowserRouter>
  );
}

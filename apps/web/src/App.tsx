import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';

const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const AdminUsers = lazy(() => import('@/pages/AdminUsers').then(m => ({ default: m.AdminUsers })));
const Chat = lazy(() => import('@/pages/Chat').then(m => ({ default: m.Chat })));
const Tasks = lazy(() => import('@/pages/Tasks').then(m => ({ default: m.Tasks })));
const Projects = lazy(() => import('@/pages/Projects').then(m => ({ default: m.Projects })));
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail').then(m => ({ default: m.ProjectDetail })));
const ProjectTasks = lazy(() => import('@/pages/ProjectTasks').then(m => ({ default: m.ProjectTasks })));
const CRM = lazy(() => import('@/pages/CRM').then(m => ({ default: m.CRM })));
const Finance = lazy(() => import('@/pages/Finance').then(m => ({ default: m.Finance })));
const Agents = lazy(() => import('@/pages/Agents').then(m => ({ default: m.Agents })));
const Clarifications = lazy(() => import('@/pages/Clarifications').then(m => ({ default: m.Clarifications })));
const Notebooks = lazy(() => import('@/pages/Notebooks').then(m => ({ default: m.Notebooks })));
const Help = lazy(() => import('@/pages/Help').then(m => ({ default: m.Help })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

const FullScreenLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-deo-accent mb-4"></div>
      <p className="text-slate-600">Đang tải...</p>
    </div>
  </div>
);

const RouteFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-deo-accent"></div>
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Suspense fallback={<RouteFallback />}><Dashboard /></Suspense>} />
        <Route path="/chat" element={<Suspense fallback={<RouteFallback />}><Chat /></Suspense>} />
        <Route path="/tasks" element={<Suspense fallback={<RouteFallback />}><Tasks /></Suspense>} />
        <Route path="/projects" element={<Suspense fallback={<RouteFallback />}><Projects /></Suspense>} />
        <Route path="/projects/:id" element={<Suspense fallback={<RouteFallback />}><ProjectDetail /></Suspense>} />
        <Route path="/projects/:id/tasks" element={<Suspense fallback={<RouteFallback />}><ProjectTasks /></Suspense>} />
        <Route path="/crm" element={<Suspense fallback={<RouteFallback />}><CRM /></Suspense>} />
        <Route path="/finance" element={<Suspense fallback={<RouteFallback />}><Finance /></Suspense>} />
        <Route path="/agents" element={<Suspense fallback={<RouteFallback />}><Agents /></Suspense>} />
        <Route path="/clarifications" element={<Suspense fallback={<RouteFallback />}><Clarifications /></Suspense>} />
        <Route path="/notebooks" element={<Suspense fallback={<RouteFallback />}><Notebooks /></Suspense>} />
        <Route path="/admin/users" element={<Suspense fallback={<RouteFallback />}><AdminUsers /></Suspense>} />
        <Route path="/help" element={<Suspense fallback={<RouteFallback />}><Help /></Suspense>} />
      </Route>
    </Routes>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

import { Helmet } from 'react-helmet-async';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OverviewView } from '@/components/dashboard/OverviewView';
import { HistoryView } from '@/components/dashboard/HistoryView';
import { MyDeclarationsView } from '@/components/dashboard/MyDeclarationsView';
import { CasesView } from '@/components/dashboard/CasesView';
import { UsersView } from '@/components/dashboard/UsersView';
import { MetricsView } from '@/components/dashboard/MetricsView';
import MapPage from './MapPage';

export default function Dashboard() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Helmet>
        <title>Tableau de bord — TraceIMEI-BJ</title>
        <meta name="description" content="Votre tableau de bord TraceIMEI-BJ : vérifications, déclarations et statistiques selon votre rôle." />
      </Helmet>
      <DashboardLayout>
        <Routes>
          <Route index element={<OverviewView />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="declarations" element={<MyDeclarationsView />} />
          <Route
            path="cases"
            element={role === 'enqueteur' || role === 'admin' ? <CasesView /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="map"
            element={role === 'enqueteur' || role === 'admin' ? <MapPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="users"
            element={role === 'admin' ? <UsersView /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="metrics"
            element={role === 'admin' ? <MetricsView /> : <Navigate to="/dashboard" replace />}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </>
  );
}

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
import { ProfileView } from '@/components/dashboard/ProfileView';
import MapPage from './MapPage';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const { t } = useTranslation();

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
        <title>{t('dashboard.metaTitle')}</title>
        <meta name="description" content={t('dashboard.metaDescription')} />
      </Helmet>
      <DashboardLayout>
        <Routes>
          <Route index element={<OverviewView />} />
          <Route
            path="history"
            element={role === 'enqueteur' || role === 'admin' ? <Navigate to="/dashboard" replace /> : <HistoryView />}
          />
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
          <Route path="profile" element={<ProfileView />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </>
  );
}

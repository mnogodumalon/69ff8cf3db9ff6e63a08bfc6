import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import HundeprofilPage from '@/pages/HundeprofilPage';
import AktivitaetserfassungPage from '@/pages/AktivitaetserfassungPage';
import GesundheitFitnessPage from '@/pages/GesundheitFitnessPage';
import PublicFormHundeprofil from '@/pages/public/PublicForm_Hundeprofil';
import PublicFormAktivitaetserfassung from '@/pages/public/PublicForm_Aktivitaetserfassung';
import PublicFormGesundheitFitness from '@/pages/public/PublicForm_GesundheitFitness';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/69ff8cdbc08467589ae138e4" element={<PublicFormHundeprofil />} />
              <Route path="public/69ff8ce06b990c8518369d72" element={<PublicFormAktivitaetserfassung />} />
              <Route path="public/69ff8ce28bc98a35f64e87d0" element={<PublicFormGesundheitFitness />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="hundeprofil" element={<HundeprofilPage />} />
                <Route path="aktivitaetserfassung" element={<AktivitaetserfassungPage />} />
                <Route path="gesundheit-&-fitness" element={<GesundheitFitnessPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}

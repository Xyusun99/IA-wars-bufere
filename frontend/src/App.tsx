import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DetalleExpedientePage from './pages/DetalleExpedientePage';
import ExpedientesPage from './pages/ExpedientesPage';
import NuevoExpedientePage from './pages/NuevoExpedientePage';

// Rutas ya definidas: cada responsable solo edita su página.
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ExpedientesPage />} />
        <Route path="/expedientes/nuevo" element={<NuevoExpedientePage />} />
        <Route path="/expedientes/:id" element={<DetalleExpedientePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

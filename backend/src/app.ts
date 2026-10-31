import cors from 'cors';
import express from 'express';
import { getPool } from './config/db.js';
import { errorHandler } from './middlewares/errorHandler.js';
import expedientesRoutes from './routes/expedientes.routes.js';
import seguimientoRoutes from './routes/seguimiento.routes.js';
import reaperturaRoutes from './routes/reapertura.routes.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const db = await getPool();
    await db.request().query('SELECT 1 AS ok');
    res.json({ ok: true, db: 'conectada' });
  } catch (err) {
    res.status(503).json({ ok: false, db: (err as Error).message });
  }
});

// Las rutas ya están montadas: cada responsable solo edita su archivo de rutas.
app.use('/api/expedientes', expedientesRoutes);
app.use('/api/expedientes', seguimientoRoutes);
app.use('/api/expedientes', reaperturaRoutes); // Parte 2 (mavasquez)

app.use(errorHandler);

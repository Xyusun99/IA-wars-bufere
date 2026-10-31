import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { obtenerExpediente, obtenerHistorial } from '../api/seguimiento';
import Alert from '../components/Alert';
import EstadoBadge from '../components/EstadoBadge';
import Historial from '../components/Historial';
import type { EntradaHistorial, Expediente } from '../types';
import { formatFecha } from '../utils/format';

export default function DetalleExpedientePage() {
  const { id } = useParams();
  const location = useLocation();
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const solicitud = useRef(0);
  const mensaje = typeof location.state?.mensaje === 'string' ? location.state.mensaje : null;

  const recargar = useCallback(async () => {
    const actual = ++solicitud.current;
    setCargando(true);
    setError(null);
    setExpediente(null);
    setHistorial([]);
    const expedienteId = Number(id);

    if (!id || !/^\d+$/.test(id) || !Number.isSafeInteger(expedienteId) || expedienteId < 1) {
      setError('El expediente no existe');
      setCargando(false);
      return;
    }

    try {
      const [detalle, entradas] = await Promise.all([
        obtenerExpediente(expedienteId), obtenerHistorial(expedienteId),
      ]);
      if (actual !== solicitud.current) return;
      setExpediente(detalle);
      setHistorial(entradas);
    } catch (err) {
      if (actual !== solicitud.current) return;
      setError(err instanceof ApiError && err.status === 404
        ? 'El expediente no existe'
        : err instanceof Error ? err.message : 'No se pudo cargar el expediente.');
    } finally {
      if (actual === solicitud.current) setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    void recargar();
    // Ignorar respuestas anteriores al cambiar de ruta o desmontar la página.
    return () => { solicitud.current += 1; };
  }, [recargar]);

  return (
    <section>
      <Link to="/">← Volver al listado</Link>
      <h1>Detalle del expediente</h1>
      {mensaje && <Alert tipo="exito">{mensaje}</Alert>}
      {cargando && <p role="status">Cargando...</p>}
      {error && <Alert tipo="error">{error}</Alert>}
      {!cargando && !error && expediente && (
        <>
          <div className="card">
            <h2>{expediente.codigo ?? '—'}</h2>
            {expediente.estado ? <EstadoBadge estado={expediente.estado} /> : '—'}
            <dl>
              <dt>Solicitante</dt><dd>{expediente.solicitante ?? '—'}</dd>
              <dt>Asunto</dt><dd>{expediente.asunto ?? '—'}</dd>
              <dt>Responsable</dt><dd>{expediente.responsable ?? '—'}</dd>
              <dt>Categoría</dt><dd>{expediente.categoria ?? '—'}</dd>
              <dt>Fecha de apertura</dt><dd>{formatFecha(expediente.fechaApertura ?? null)}</dd>
              {expediente.estado === 'Cerrado' && (
                <>
                  <dt>Fecha de cierre</dt><dd>{formatFecha(expediente.fechaCierre ?? null)}</dd>
                  <dt>Motivo de cierre</dt><dd>{expediente.motivoCierre ?? '—'}</dd>
                </>
              )}
            </dl>
          </div>
          <div className="card">
            <h2>Historial</h2>
            <Historial entradas={historial} />
          </div>
        </>
      )}
    </section>
  );
}

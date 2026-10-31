import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { obtenerExpediente, obtenerHistorial, pasarASeguimiento } from '../api/seguimiento';
import ActividadForm from '../components/ActividadForm';
import Alert from '../components/Alert';
import EstadoBadge from '../components/EstadoBadge';
import Historial from '../components/Historial';
import type { EntradaHistorial, Expediente } from '../types';
import { formatFecha } from '../utils/format';

export default function DetalleExpedientePage() {
  const { id } = useParams();
  return <DetalleExpediente key={id} id={id} />;
}

function DetalleExpediente({ id }: { id: string | undefined }) {
  const location = useLocation();
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardandoActividad, setGuardandoActividad] = useState(false);
  const [pasando, setPasando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const accionPendiente = useRef(false);
  const solicitud = useRef(0);
  const ocupado = cargando || pasando || guardandoActividad;
  const mensaje = typeof location.state?.mensaje === 'string' ? location.state.mensaje : null;

  const recargar = useCallback(async () => {
    const actual = ++solicitud.current;
    setCargando(true);
    setError(null);
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

  async function iniciarSeguimiento() {
    if (!expediente || expediente.estado !== 'Abierto' || ocupado || accionPendiente.current) return;
    if (!window.confirm('¿Pasar el expediente a En seguimiento?')) return;
    accionPendiente.current = true;
    setPasando(true);
    setErrorAccion(null);
    setExito(null);
    try {
      await pasarASeguimiento(expediente.id);
      setExito('Expediente en seguimiento.');
      await recargar();
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : 'No se pudo cambiar el estado.');
    } finally {
      accionPendiente.current = false;
      setPasando(false);
    }
  }

  return (
    <section>
      <Link to="/">← Volver al listado</Link>
      <h1>Detalle del expediente</h1>
      {mensaje && <Alert tipo="exito">{mensaje}</Alert>}
      {exito && <Alert tipo="exito">{exito}</Alert>}
      {errorAccion && <Alert tipo="error">{errorAccion}</Alert>}
      {cargando && <p role="status">Cargando...</p>}
      {error && <Alert tipo="error">{error}</Alert>}
      {!error && expediente && (
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
          {expediente.estado === 'Abierto' && (
            <div className="card">
              <button className="btn btn--primary" type="button" disabled={ocupado}
                onClick={() => void iniciarSeguimiento()}>
                {pasando ? 'Actualizando...' : 'Pasar a En seguimiento'}
              </button>
            </div>
          )}
          {(expediente.estado === 'Abierto' || expediente.estado === 'En seguimiento') && (
            <div className="card">
              <h2>Registrar actividad</h2>
              <ActividadForm expedienteId={expediente.id} onCreada={recargar}
                disabled={ocupado} onEnviandoChange={setGuardandoActividad} />
            </div>
          )}
          <div className="card">
            <h2>Historial</h2>
            <Historial entradas={historial} />
          </div>
        </>
      )}
    </section>
  );
}

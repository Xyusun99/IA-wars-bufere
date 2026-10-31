import { useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { cerrarExpediente } from '../api/seguimiento';
import type { Expediente } from '../types';
import Alert from './Alert';

interface Props {
  expedienteId: number;
  actividadesCicloActual: number;
  onCerrado: (expediente: Expediente) => void | Promise<void>;
  disabled?: boolean;
  onEnviandoChange?: (enviando: boolean) => void;
}

export default function CierreForm({ expedienteId, actividadesCicloActual, onCerrado,
  disabled = false, onEnviandoChange }: Props) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detalles, setDetalles] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const pendiente = useRef(false);
  // Un contador ausente tampoco permite afirmar que hay una actividad nueva.
  const sinActividades = !(actividadesCicloActual > 0);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || pendiente.current || sinActividades) return;
    setError(null);
    setDetalles({});
    if (!motivo.trim()) {
      setDetalles({ motivo: 'Ingrese el motivo de cierre.' });
      setError('Revise los campos marcados.');
      return;
    }
    if (!window.confirm('¿Cerrar el expediente? No admitirá nuevas actividades hasta que se reabra.')) return;
    pendiente.current = true;
    setEnviando(true);
    onEnviandoChange?.(true);
    try {
      const cerrado = await cerrarExpediente(expedienteId, motivo.trim());
      setMotivo('');
      await onCerrado(cerrado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar el expediente.');
      if (err instanceof ApiError) setDetalles(err.detalles ?? {});
    } finally {
      pendiente.current = false;
      setEnviando(false);
      onEnviandoChange?.(false);
    }
  }

  return (
    <form className="card form" onSubmit={guardar} noValidate>
      <h2>Cerrar expediente</h2>
      {sinActividades && <Alert tipo="info">Debe registrar al menos una actividad antes de cerrar</Alert>}
      {error && <Alert tipo="error">{error}</Alert>}
      <div className={`field${detalles.motivo ? ' field--error' : ''}`}>
        <label htmlFor="motivo-cierre">Motivo de cierre*</label>
        <textarea id="motivo-cierre" value={motivo} required maxLength={500}
          disabled={disabled || enviando} onChange={(event) => setMotivo(event.target.value)}
          aria-invalid={Boolean(detalles.motivo)}
          aria-describedby={detalles.motivo ? 'motivo-cierre-error' : undefined} />
        {detalles.motivo && <span id="motivo-cierre-error" className="field__error">{detalles.motivo}</span>}
      </div>
      {Object.entries(detalles).filter(([campo]) => campo !== 'motivo').map(([campo, mensaje]) => (
        <p className="field__error" key={campo}>{campo}: {mensaje}</p>
      ))}
      <div>
        <button type="submit" className="btn btn--danger" disabled={disabled || enviando || sinActividades}>
          {enviando ? 'Cerrando...' : 'Cerrar expediente'}
        </button>
      </div>
    </form>
  );
}

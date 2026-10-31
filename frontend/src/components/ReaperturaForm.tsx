import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { reabrirExpediente } from '../api/reapertura';
import type { Expediente } from '../types';
import Alert from './Alert';

/*
 * Parte 2 - Responsable: mavasquez.
 * Uso en DetalleExpedientePage (Bagner), solo cuando estado === 'Cerrado':
 *   <ReaperturaForm expedienteId={exp.id} onReabierto={recargar} />
 * La regla "solo Cerrado" también la aplica el backend (sp_ReabrirExpediente -> 409).
 */
interface Props {
  expedienteId: number;
  onReabierto: (exp: Expediente) => void;
}

export default function ReaperturaForm({ expedienteId, onReabierto }: Props) {
  const [motivo, setMotivo] = useState('');
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral(null);

    if (motivo.trim() === '') {
      setErrorCampo('El motivo de reapertura es obligatorio.');
      return;
    }
    setErrorCampo(null);
    if (!window.confirm('¿Reabrir el expediente? Pasará a En seguimiento y se conservará todo su historial.')) {
      return;
    }

    setEnviando(true);
    try {
      const exp = await reabrirExpediente(expedienteId, motivo);
      setMotivo('');
      onReabierto(exp);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.detalles?.motivo) setErrorCampo(err.detalles.motivo);
        setErrorGeneral(err.message);
      } else {
        setErrorGeneral('Ocurrió un error inesperado.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2>Reabrir expediente</h2>
      <p className="muted">
        Use esta acción si se recibió información después del cierre. Se conservan las actividades y todos los
        cierres anteriores.
      </p>
      {errorGeneral && <Alert tipo="error">{errorGeneral}</Alert>}
      <div className={`field${errorCampo ? ' field--error' : ''}`}>
        <label htmlFor="motivo-reapertura" className="required">
          Motivo de reapertura
        </label>
        <textarea
          id="motivo-reapertura"
          value={motivo}
          maxLength={500}
          onChange={(e) => setMotivo(e.target.value)}
          aria-invalid={errorCampo ? true : undefined}
          aria-describedby={errorCampo ? 'motivo-reapertura-error' : undefined}
        />
        {errorCampo && (
          <span id="motivo-reapertura-error" className="field__error">
            {errorCampo}
          </span>
        )}
      </div>
      <div>
        <button type="submit" className="btn btn--primary" disabled={enviando}>
          {enviando ? 'Reabriendo...' : 'Reabrir expediente'}
        </button>
      </div>
    </form>
  );
}

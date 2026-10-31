import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../api/client';
import { agregarActividad } from '../api/seguimiento';
import Alert from './Alert';

type Props = {
  expedienteId: number;
  onCreada: () => void | Promise<void>;
  disabled?: boolean;
  onEnviandoChange?: (enviando: boolean) => void;
};

export default function ActividadForm({ expedienteId, onCreada, disabled = false, onEnviandoChange }: Props) {
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detalles, setDetalles] = useState<Record<string, string>>({});
  const [creada, setCreada] = useState(false);
  const pendiente = useRef(false);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendiente.current || disabled) return;
    setError(null);
    setDetalles({});
    setCreada(false);
    if (!descripcion.trim()) {
      setDetalles({ descripcion: 'Ingrese la descripción de la actividad.' });
      setError('Revise los campos marcados.');
      return;
    }
    pendiente.current = true;
    setEnviando(true);
    onEnviandoChange?.(true);
    try {
      await agregarActividad(expedienteId, { descripcion: descripcion.trim(), tipo: tipo || null });
      setDescripcion('');
      setTipo('');
      setCreada(true);
      await onCreada();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la actividad.');
      if (err instanceof ApiError) setDetalles(err.detalles ?? {});
    } finally {
      pendiente.current = false;
      setEnviando(false);
      onEnviandoChange?.(false);
    }
  }

  return (
    <form className="form" onSubmit={guardar} noValidate>
      {error && <Alert tipo="error">{error}</Alert>}
      {creada && <Alert tipo="exito">Actividad registrada.</Alert>}
      <div className={`field${detalles.descripcion ? ' field--error' : ''}`}>
        <label htmlFor="actividad-descripcion">Descripción de la actividad*</label>
        <textarea id="actividad-descripcion" value={descripcion} required maxLength={1000}
          disabled={disabled || enviando} onChange={(event) => setDescripcion(event.target.value)}
          aria-invalid={Boolean(detalles.descripcion)}
          aria-describedby={detalles.descripcion ? 'actividad-descripcion-error' : undefined} />
        {detalles.descripcion && <span id="actividad-descripcion-error" className="field__error">{detalles.descripcion}</span>}
      </div>
      <div className={`field${detalles.tipo ? ' field--error' : ''}`}>
        <label htmlFor="actividad-tipo">Tipo</label>
        <select id="actividad-tipo" value={tipo} disabled={disabled || enviando}
          onChange={(event) => setTipo(event.target.value)} aria-invalid={Boolean(detalles.tipo)}
          aria-describedby={detalles.tipo ? 'actividad-tipo-error' : undefined}>
          <option value="">— Sin tipo —</option>
          {['Llamada', 'Reunión', 'Documento', 'Audiencia', 'Otro'].map((opcion) => (
            <option key={opcion} value={opcion}>{opcion}</option>
          ))}
        </select>
        {detalles.tipo && <span id="actividad-tipo-error" className="field__error">{detalles.tipo}</span>}
      </div>
      <button className="btn btn--primary" type="submit" disabled={disabled || enviando}>
        {enviando ? 'Guardando...' : 'Registrar actividad'}
      </button>
    </form>
  );
}

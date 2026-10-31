import type { EntradaHistorial } from '../types';
import { formatFecha } from '../utils/format';

export default function Historial({ entradas }: { entradas: EntradaHistorial[] }) {
  if (entradas.length === 0) return <p className="muted">Sin movimientos</p>;

  return (
    <ul className="timeline">
      {entradas.map((entrada) => {
        const esEstado = entrada.tipoEntrada === 'ESTADO';
        const esReapertura = esEstado && entrada.estadoAnterior === 'Cerrado';
        return (
          <li key={`${entrada.expedienteId}-${entrada.orden}`}
            className={`timeline__item${esEstado ? ' timeline__item--estado' : ''}`}>
            <strong>
              {esReapertura ? 'Reapertura' : esEstado ? 'Cambio de estado' : 'Actividad'}
              {!esEstado && entrada.tipoActividad ? ` · ${entrada.tipoActividad}` : ''}
            </strong>
            <div className="timeline__meta">{formatFecha(entrada.fecha ?? null)}</div>
            <p>{entrada.descripcion ?? '—'}</p>
            {esEstado && (entrada.estadoAnterior || entrada.estadoNuevo) && (
              <p>{entrada.estadoAnterior ?? '—'} → {entrada.estadoNuevo ?? '—'}</p>
            )}
            {esEstado && entrada.motivo && <p>Motivo: {entrada.motivo}</p>}
          </li>
        );
      })}
    </ul>
  );
}

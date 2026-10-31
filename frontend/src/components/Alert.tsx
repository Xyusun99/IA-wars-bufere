import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Icon, { type IconName } from './Icon';

type Tipo = 'exito' | 'error' | 'info';

const ICONOS: Record<Tipo, IconName> = { exito: 'checkCircle', error: 'alert', info: 'info' };
const DURACION_TOAST_MS = 5000;

/**
 * Mensaje de confirmación / error / información. Usar en todas las pantallas.
 * - 'error' e 'info' se muestran en línea, junto al formulario o contenido.
 * - 'exito' se muestra como TOAST flotante (esquina superior derecha), se
 *   cierra solo a los 5 s o con la X. Las páginas no cambian: siguen usando
 *   <Alert tipo="exito">…</Alert>.
 */
export default function Alert({ tipo, children }: { tipo: Tipo; children: ReactNode }) {
  if (tipo === 'exito') return <Toast>{children}</Toast>;

  return (
    <div className={`alert alert--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icon name={ICONOS[tipo]} className="alert__icon" />
      <div className="alert__body">{children}</div>
    </div>
  );
}

function Toast({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [saliendo, setSaliendo] = useState(false);
  const [region, setRegion] = useState<HTMLElement | null | undefined>(undefined);

  // La región la crea Layout; existe en el DOM recién después del primer render.
  useEffect(() => setRegion(document.getElementById('toast-region')), []);

  // Un mensaje nuevo vuelve a mostrar el toast (se compara el texto, no la referencia).
  const clave = String(children);
  useEffect(() => {
    setVisible(true);
    setSaliendo(false);
    const salir = setTimeout(() => setSaliendo(true), DURACION_TOAST_MS - 250);
    const ocultar = setTimeout(() => setVisible(false), DURACION_TOAST_MS);
    return () => {
      clearTimeout(salir);
      clearTimeout(ocultar);
    };
  }, [clave]);

  if (!visible || region === undefined) return null;

  const toast = (
    <div className={`toast${saliendo ? ' toast--saliendo' : ''}`} role="status">
      <Icon name="checkCircle" className="toast__icon" />
      <div className="toast__body">{children}</div>
      <button type="button" className="toast__close" aria-label="Cerrar mensaje" onClick={() => setVisible(false)}>
        <Icon name="x" />
      </button>
      <span className="toast__progress" style={{ animationDuration: `${DURACION_TOAST_MS}ms` }} />
    </div>
  );

  // Sin región (p. ej. fuera de Layout) se muestra en línea como respaldo.
  return region ? createPortal(toast, region) : toast;
}

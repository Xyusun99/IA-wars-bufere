import type { ReactNode } from 'react';

type Tipo = 'exito' | 'error' | 'info';

/** Mensaje de confirmación / error / información. Usar en todas las pantallas. */
export default function Alert({ tipo, children }: { tipo: Tipo; children: ReactNode }) {
  return (
    <div className={`alert alert--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

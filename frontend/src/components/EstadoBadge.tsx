import type { Estado } from '../types';

const CLASES: Record<Estado, string> = {
  Abierto: 'badge--abierto',
  'En seguimiento': 'badge--seguimiento',
  Cerrado: 'badge--cerrado',
};

export default function EstadoBadge({ estado }: { estado: Estado }) {
  return <span className={`badge ${CLASES[estado]}`}>{estado}</span>;
}

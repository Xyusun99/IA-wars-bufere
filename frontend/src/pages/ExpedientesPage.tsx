/*
 * Responsable: Dayana (rama feature/Dayana)
 * Listado con identificador, persona, responsable y estado + búsqueda por
 * identificador o nombre/alias + mensaje "sin resultados". Ver docs/PLAN_EQUIPO.md.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { listarExpedientes } from '../api/expedientes';
import Alert from '../components/Alert';
import EstadoBadge from '../components/EstadoBadge';
import type { Estado, Expediente } from '../types';
import { formatFecha } from '../utils/format';

const ESTADOS: Estado[] = ['Abierto', 'En seguimiento', 'Cerrado'];

export default function ExpedientesPage() {
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState<Estado | ''>('');
  // Filtros de la última búsqueda enviada (para el mensaje "sin resultados").
  const [aplicado, setAplicado] = useState<{ q: string; estado: Estado | '' }>({ q: '', estado: '' });
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Evita la condición de carrera: solo se aplica la respuesta de la última búsqueda.
  const ultimaPeticion = useRef(0);

  const cargar = useCallback(async (q: string, est: Estado | '') => {
    const id = ++ultimaPeticion.current;
    setCargando(true);
    setError(null);
    try {
      const datos = await listarExpedientes(q, est || undefined);
      if (id !== ultimaPeticion.current) return;
      setExpedientes(datos);
      setAplicado({ q, estado: est });
    } catch (err) {
      if (id !== ultimaPeticion.current) return;
      setExpedientes([]);
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los expedientes.');
    } finally {
      if (id === ultimaPeticion.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar('', '');
  }, [cargar]);

  function buscar(e: FormEvent) {
    e.preventDefault();
    void cargar(texto.trim(), estado);
  }

  function limpiar() {
    setTexto('');
    setEstado('');
    void cargar('', '');
  }

  function abrirConTeclado(e: KeyboardEvent<HTMLTableRowElement>, id: number) {
    // Solo cuando el foco está en la fila; el Link del código ya navega por sí mismo.
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/expedientes/${id}`);
    }
  }

  const hayFiltro = Boolean(aplicado.q || aplicado.estado);

  return (
    <section>
      <div className="toolbar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Expedientes</h1>
        <Link to="/expedientes/nuevo" className="btn btn--primary">
          Nuevo expediente
        </Link>
      </div>

      <form className="toolbar" onSubmit={buscar} role="search">
        <input
          type="search"
          aria-label="Buscar expedientes"
          placeholder="Buscar por identificador (EXP-00001) o nombre/alias"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <select
          className="btn"
          aria-label="Filtrar por estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value as Estado | '')}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn--primary" disabled={cargando}>
          Buscar
        </button>
        <button type="button" className="btn" onClick={limpiar}>
          Limpiar
        </button>
      </form>

      {error && <Alert tipo="error">{error}</Alert>}

      {cargando ? (
        <p className="muted" role="status">
          Cargando...
        </p>
      ) : (
        !error &&
        (expedientes.length === 0 ? (
          <Alert tipo="info">
            {hayFiltro
              ? `No se encontraron expedientes${aplicado.q ? ` para "${aplicado.q}"` : ''}${
                  aplicado.estado ? ` con estado ${aplicado.estado}` : ''
                }.`
              : 'Aún no hay expedientes. Cree el primero.'}
          </Alert>
        ) : (
          <>
            <p className="muted">
              {expedientes.length} {expedientes.length === 1 ? 'expediente' : 'expedientes'}
              {hayFiltro ? ' encontrados' : ''}
            </p>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Identificador</th>
                    <th>Solicitante</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                    <th>Apertura</th>
                  </tr>
                </thead>
                <tbody>
                  {expedientes.map((exp) => (
                    <tr
                      key={exp.id}
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/expedientes/${exp.id}`)}
                      onKeyDown={(e) => abrirConTeclado(e, exp.id)}
                    >
                      <td>
                        <Link to={`/expedientes/${exp.id}`} onClick={(e) => e.stopPropagation()}>
                          {exp.codigo}
                        </Link>
                      </td>
                      <td>{exp.solicitante}</td>
                      <td>{exp.responsable}</td>
                      <td>
                        <EstadoBadge estado={exp.estado} />
                      </td>
                      <td>{formatFecha(exp.fechaApertura)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ))
      )}
    </section>
  );
}

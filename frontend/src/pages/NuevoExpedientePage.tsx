/*
 * Responsable: Dayana (rama feature/Dayana)
 * Formulario de apertura: solicitante, asunto, responsable (obligatorios), categoría (opcional).
 * Ver docs/PLAN_EQUIPO.md.
 */
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { crearExpediente } from '../api/expedientes';
import Alert from '../components/Alert';
import type { Categoria, NuevoExpediente } from '../types';

type Campo = 'solicitante' | 'asunto' | 'responsable' | 'categoria';
type Errores = Partial<Record<Campo, string>>;

interface Valores {
  solicitante: string;
  asunto: string;
  responsable: string;
  categoria: Categoria | '';
}

const VACIO: Valores = { solicitante: '', asunto: '', responsable: '', categoria: '' };
const CATEGORIAS: Categoria[] = ['Civil', 'Familiar', 'Laboral'];

// Límites de docs/openapi.yaml (NuevoExpediente).
const MAX = { solicitante: 150, asunto: 500, responsable: 150 } as const;

function validar(v: Valores): Errores {
  const errores: Errores = {};
  const requerido = (campo: keyof typeof MAX, vacio: string) => {
    const texto = v[campo].trim();
    if (!texto) errores[campo] = vacio;
    else if (texto.length > MAX[campo]) errores[campo] = `Use como máximo ${MAX[campo]} caracteres.`;
  };
  requerido('solicitante', 'Ingrese el nombre ficticio o alias del solicitante.');
  requerido('asunto', 'Describa brevemente el asunto.');
  requerido('responsable', 'Ingrese el nombre del responsable.');
  if (v.categoria && !CATEGORIAS.includes(v.categoria)) {
    errores.categoria = 'Seleccione Civil, Familiar o Laboral.';
  }
  return errores;
}

export default function NuevoExpedientePage() {
  const navigate = useNavigate();
  const [valores, setValores] = useState<Valores>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cambiar(campo: Campo, valor: string) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    // Al corregir un campo se quita su error.
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (guardando) return;

    const encontrados = validar(valores);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) {
      setErrorGeneral('Revise los campos marcados.');
      return;
    }

    const datos: NuevoExpediente = {
      solicitante: valores.solicitante.trim(),
      asunto: valores.asunto.trim(),
      responsable: valores.responsable.trim(),
      categoria: valores.categoria || null,
    };

    setGuardando(true);
    setErrorGeneral(null);
    try {
      const exp = await crearExpediente(datos);
      navigate(`/expedientes/${exp.id}`, {
        state: { mensaje: `Expediente ${exp.codigo} creado correctamente.` },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorGeneral(err.message);
        if (err.detalles) setErrores(err.detalles as Errores);
      } else {
        setErrorGeneral('Ocurrió un error inesperado.');
      }
      setGuardando(false);
    }
  }

  const props = (campo: Campo) => ({
    id: campo,
    name: campo,
    'aria-invalid': Boolean(errores[campo]),
    'aria-describedby': errores[campo] ? `${campo}-error` : undefined,
    disabled: guardando,
  });

  const claseCampo = (campo: Campo) => `field${errores[campo] ? ' field--error' : ''}`;
  const mensajeError = (campo: Campo) =>
    errores[campo] && (
      <span id={`${campo}-error`} className="field__error">
        {errores[campo]}
      </span>
    );

  return (
    <section>
      <h1>Nuevo expediente</h1>

      {errorGeneral && <Alert tipo="error">{errorGeneral}</Alert>}

      <div className="card">
        <p className="muted">Use solo datos ficticios. No ingrese documentos de identificación.</p>

        <form className="form" onSubmit={enviar} noValidate>
          <div className={claseCampo('solicitante')}>
            <label htmlFor="solicitante" className="required">
              Nombre ficticio o alias del solicitante
            </label>
            <input
              {...props('solicitante')}
              type="text"
              maxLength={MAX.solicitante}
              value={valores.solicitante}
              onChange={(e) => cambiar('solicitante', e.target.value)}
            />
            {mensajeError('solicitante')}
          </div>

          <div className={claseCampo('asunto')}>
            <label htmlFor="asunto" className="required">
              Descripción breve del asunto
            </label>
            <textarea
              {...props('asunto')}
              maxLength={MAX.asunto}
              value={valores.asunto}
              onChange={(e) => cambiar('asunto', e.target.value)}
            />
            <span className="hint">
              {valores.asunto.length}/{MAX.asunto} caracteres
            </span>
            {mensajeError('asunto')}
          </div>

          <div className={claseCampo('responsable')}>
            <label htmlFor="responsable" className="required">
              Nombre del responsable
            </label>
            <input
              {...props('responsable')}
              type="text"
              maxLength={MAX.responsable}
              value={valores.responsable}
              onChange={(e) => cambiar('responsable', e.target.value)}
            />
            {mensajeError('responsable')}
          </div>

          <div className={claseCampo('categoria')}>
            <label htmlFor="categoria">Categoría</label>
            <select
              {...props('categoria')}
              value={valores.categoria}
              onChange={(e) => cambiar('categoria', e.target.value)}
            >
              <option value="">— Sin categoría —</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="hint">Opcional.</span>
            {mensajeError('categoria')}
          </div>

          <div className="toolbar">
            <button type="submit" className="btn btn--primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Crear expediente'}
            </button>
            <Link to="/" className="btn">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

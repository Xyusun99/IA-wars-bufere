# Aporte de dayana

_Pendiente: generar con el Prompt 3 de docs/PLAN_EQUIPO.md._

## Comprobaciones después de integrar la Parte 2 (2026-10-31)

Rama `feature/Dayana` en `fe9885c` (igual que `main`: incluye PR #3 Parte 2 y PR #4 API de Daniel).

| Comprobación | Resultado |
|---|---|
| Frontend `npm run typecheck` (`tsc -b`) | Cumple: sin errores |
| Frontend `npm run build` (`tsc -b && vite build`) | Cumple: sin errores |
| Backend `npm run typecheck` | Cumple: sin errores |
| Revisión de código: `api/expedientes.ts` frente a `expedientes.routes.ts` (Daniel) | Coinciden: `GET /expedientes?q=&estado=` y `POST /expedientes` (201, 400 con `detalles` por campo). El listado lee `vw_Expedientes` con `SELECT *`, así que trae los campos nuevos de la Parte 2 |
| Revisión de código: cambios de la Parte 2 en `types/index.ts` | Solo agrega campos a `Expediente`. No afecta a listado ni apertura |

## Pruebas funcionales

**Estado: pendientes.** Todavía no se ejecutaron. En este equipo no existe la base `BufetePopular` ni el archivo `backend/.env`, así que el backend no puede arrancar. Se completarán con lo observado al ejecutarlas.

### Recorrido 1 · Apertura
| Paso | Esperado | Observado | Resultado |
|---|---|---|---|
| Crear dos expedientes válidos | Ambos se crean en estado Abierto | | Pendiente |
| Comparar identificadores | Códigos distintos (`EXP-0000N`) | | Pendiente |
| Enviar con campos obligatorios vacíos | Error bajo cada campo; no se crea | | Pendiente |
| Enviar con campos de solo espacios | Error bajo cada campo; no se crea | | Pendiente |

### Recorrido 2 · Consulta
| Paso | Esperado | Observado | Resultado |
|---|---|---|---|
| Buscar por código (`EXP-0000N`) y por id | Aparece el expediente | | Pendiente |
| Buscar por parte del alias | Aparecen los que coinciden | | Pendiente |
| Buscar un texto inexistente | Mensaje de "sin resultados" | | Pendiente |
| Abrir el detalle desde el listado | Se abre `/expedientes/:id` con su historial | | Pendiente |

### Regresión Parte 2
| Paso | Esperado | Observado | Resultado |
|---|---|---|---|
| Reabrir un expediente Cerrado (p. ej. `Alias Demo C`) y volver al listado | Aparece con estado "En seguimiento" | | Pendiente |
| Repetir la apertura (recorrido 1) | Igual que antes de la Parte 2 | | Pendiente |
| Repetir la búsqueda (recorrido 2), también con filtro "En seguimiento" | Igual que antes de la Parte 2 | | Pendiente |

# Parte 2 · Reapertura de expedientes — qué cambió y qué hacer después de tu primer commit

> Lean esto **después de subir el commit de su Prompt 1**. Les toma unos 3 minutos.
> La Parte 2 vale **10 puntos** dentro de Funcionamiento y validación.

## 1. Qué pide la Parte 2 (resumen)
Hay que agregar la acción **Reabrir expediente**, que pasa de `Cerrado` a `En seguimiento`:
- El **motivo es obligatorio**: no puede estar vacío ni tener solo espacios.
- Se **rechaza** si el expediente está `Abierto` o `En seguimiento`, y la regla se aplica también en la lógica, no solo en la UI.
- Se **conservan** id, datos, actividades y **todos los cierres anteriores** con su fecha y motivo.
- Se agrega un **evento al historial** con fecha, hora, motivo y transición.
- Después de reabrir se pueden registrar actividades y **cerrar otra vez**. El nuevo cierre **no reemplaza** al anterior.

## 2. Qué ya hizo mavasquez (no tienen que programarlo)
| Pieza | Archivo | Detalle |
|---|---|---|
| Regla en BD | `database/init.sql`, **`database/migracion_parte2.sql`** | Nuevo `sp_ReabrirExpediente`. `sp_CerrarExpediente` ahora exige al menos una actividad **posterior a la última reapertura**. El historial muestra "Reapertura del expediente: Cerrado -> En seguimiento" |
| Campos nuevos en `Expediente` | vista `vw_Expedientes`, `types/index.ts`, `openapi.yaml` | `actividadesCicloActual` (actividades desde la última reapertura), `totalCierres`, `totalReaperturas` |
| Endpoint | `backend/src/routes/reapertura.routes.ts` (ya montado en `app.ts`) | `POST /api/expedientes/:id/reapertura` con `{ "motivo": "..." }` → 200 / 400 / 404 / 409 |
| UI | `frontend/src/api/reapertura.ts`, `frontend/src/components/ReaperturaForm.tsx` | Formulario listo con validación, confirmación y errores; Bagner solo lo inserta |
| Demo | `database/seed.sql` | Deja `Alias Demo C` ya **Cerrado** para mostrar la reapertura |
| Evidencia | tag `pre-parte2` | Marca el commit previo al anuncio, como exige el enunciado |

**Decisiones tomadas (para que todos puedan explicarlas al jurado):**
1. Cada cierre es una fila **inmutable** en `HistorialEstados`. `fechaCierre` y `motivoCierre` del expediente son solo el cierre **vigente** y vuelven a `null` al reabrir. Así no se pierde ningún cierre.
2. Para volver a cerrar se necesita **una actividad nueva**, registrada después de reabrir. Así lo plantea el recorrido 4: reabrir, agregar actividad y cerrar.
3. Los cambios llegan con una **migración sin pérdida de datos** y en **archivos nuevos**, para no tocar el código que ustedes ya estaban escribiendo.

## 3. Pasos para TODOS (después de su primer commit)
```bash
# 1) Suban su commit del Prompt 1 a SU rama, como siempre
git push origin feature/<TuNombre>

# 2) Traigan lo de main (mavasquez ya integró la Parte 2)
git pull origin main

# 3) Actualicen su BD UNA vez. NO borra sus datos de prueba
cd backend && npm run db:migrar
#   (alternativa: sqlcmd -S localhost -E -f 65001 -i database/migracion_parte2.sql)

# 4) Reinicien el backend (npm run dev) y sigan con su Prompt 2
```
⚠️ **No** vuelvan a ejecutar `init.sql`: borra la base de datos.
⚠️ **No** editen `app.ts`, `types/index.ts` ni `openapi.yaml`: ya tienen los cambios. Si `git pull` muestra un conflicto ahí, avisen a mavasquez.

## 4. Qué cambia para cada uno
### Daniel (API expedientes)
- Su código **no cambia**, con una condición: en `GET /` y `GET /:id`, lean de `vw_Expedientes` con `SELECT *`. Si listan columnas a mano, agreguen `actividadesCicloActual, totalCierres, totalReaperturas`. Bagner necesita esos campos en el detalle.
- En D2, punto 5 (coincidir con `openapi.yaml`), consideren estos 3 campos nuevos.

### Jaqui (API seguimiento)
- Su código **no cambia**. Los SP ya devuelven la fila completa de `vw_Expedientes`.
- **No** validen en TypeScript "al menos una actividad" usando `totalActividades`, porque ahora la regla depende de la reapertura. Esa regla ya la aplica el SP y devuelve 422.
- `GET /:id/historial` debe seguir trayendo **todas** las entradas `ESTADO`, porque ahí aparecen la reapertura y todos los cierres.

### Dayana (UI listado y apertura)
- **Nada cambia** en su código.
- En su Prompt 3, repitan los recorridos 1 y 2 como **prueba de regresión** y anoten el resultado.

### Bagner (UI detalle) — el único con cambios
Su **Prompt B2 ya está actualizado** en `docs/PLAN_EQUIPO.md`. En resumen:
1. **CierreForm:** deshabilitar el botón cuando `actividadesCicloActual === 0`, **no** con `totalActividades`.
2. **Si `estado === 'Cerrado'`:** ocultar ActividadForm, el botón de seguimiento y CierreForm, y mostrar:
   ```tsx
   import ReaperturaForm from '../components/ReaperturaForm';
   // ...
   <Alert tipo="info">Expediente cerrado: no admite nuevas actividades. Puede reabrirlo si recibió nueva información.</Alert>
   <ReaperturaForm expedienteId={exp.id} onReabierto={() => { setMensaje('Expediente reabierto.'); recargar(); }} />
   ```
3. **En la ficha:** si `totalCierres > 0`, mostrar "Cierres registrados: N". Los cierres anteriores, con fecha y motivo, se ven en el historial.
4. **Historial.tsx:** una entrada `ESTADO` con `estadoAnterior === 'Cerrado'` es una **reapertura**; muéstrenla con la etiqueta "Reapertura" y su motivo.
5. En su Prompt 3, registren también el **recorrido 4**.

## 5. Recorrido 4 · Reapertura y trazabilidad (todos lo prueban en T+65)
| Paso | Resultado esperado |
|---|---|
| Reabrir un expediente **Cerrado** con motivo vacío o con solo espacios | Error bajo el campo: "El motivo de reapertura es obligatorio." |
| Intentar reabrir uno **Abierto** o **En seguimiento** (por API: `curl -X POST .../2/reapertura -H "Content-Type: application/json" -d "{\"motivo\":\"x\"}"`) | 409 "Solo un expediente Cerrado puede reabrirse." |
| Reabrir con motivo válido | Pasa a **En seguimiento**; el historial muestra "Reapertura" con fecha, hora y motivo |
| Intentar cerrar **sin** actividad nueva | 422 "Debe registrar al menos una actividad después de la reapertura…" |
| Agregar una actividad y cerrar con motivo | Pasa a **Cerrado** |
| Recargar con **F5** | El historial conserva las actividades y **ambos cierres** con su fecha y motivo |

Repitan además los recorridos 1 a 3 para detectar **regresiones**, y anoten lo **observado** con Cumple / Parcial / No cumple en su `docs/aportes/<nombre>.md`.

## 6. Demo (3 min incluida la transición)
El jurado pidió ver **la reapertura y la conservación del historial**. Guion actualizado en `docs/PLAN_EQUIPO.md` §6. Si falta tiempo, usen `Alias Demo C` del seed, que ya está cerrado.

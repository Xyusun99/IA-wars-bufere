# Bufete Popular · Gestión de expedientes (prototipo)

> **Grupo Code Wars 5 · AI Code Wars · UMG Tech Day 2026.** Prototipo web con **datos ficticios**. No representa procedimientos oficiales del Bufete Popular y **no brinda asesoría jurídica**.

**Integrantes:** mavasquez · Daniel · Jaqui · Dayana · Bagner

**Stack:** React 18 + TypeScript (Vite) · Node.js + Express + TypeScript · SQL Server 2016+ (probado en 2022)

---

## 1. Ficha de análisis (hito inicial)

### 1.1 Problema, usuario y prioridades
- **Problema:** el Bufete Popular atiende a personas de escasos recursos y necesita organizar expedientes, registrar lo que se hace en cada uno y consultar su estado e historial sin perder información.
- **Usuario:** personal del bufete (estudiante, asesor o responsable) que abre y da seguimiento a los casos. Un solo tipo de usuario; no se exige autenticación.
- **Prioridades (en orden):**
  1. Apertura con validación de campos obligatorios (no vacíos ni solo espacios).
  2. Listado, búsqueda por identificador o nombre/alias y detalle con historial.
  3. Registro de actividades y flujo de estados `Abierto → En seguimiento → Cerrado` con sus reglas, y **reapertura** `Cerrado → En seguimiento` (Parte 2).
  4. Persistencia (los datos se conservan al recargar y al reiniciar la aplicación).
  5. Mensajes claros de confirmación y error, y navegación simple.
  6. Opcionales, solo si sobra tiempo: filtro por estado, categoría y tipo de actividad.

### 1.2 Datos principales
| Entidad | Campos | Generado por el sistema |
|---|---|---|
| **Expediente** | solicitante (alias)\*, asunto\*, responsable\*, categoría (Civil/Familiar/Laboral, opcional) | id, código `EXP-00001`, fecha/hora de apertura, estado `Abierto`, fecha y motivo de cierre |
| **Actividad** | descripción\*, tipo (opcional) | id, fecha/hora, orden |
| **Historial de estados** | estado anterior → nuevo, motivo (al cerrar y al reabrir) | fecha/hora, orden |

\* obligatorio. El historial que se muestra une actividades y cambios de estado en orden cronológico (vista `vw_HistorialExpediente`).

### 1.3 Reglas
| # | Regla | Dónde se valida |
|---|---|---|
| R1 | Solicitante, asunto y responsable son obligatorios; se rechazan si están vacíos o solo tienen espacios, y se indica qué corregir | Frontend + API + BD (CHECK y SP) |
| R2 | Al abrir: id único, fecha/hora automática, estado `Abierto` y entrada de apertura en el historial | BD (`sp_CrearExpediente`) |
| R3 | Solo `Abierto` y `En seguimiento` admiten actividades; la descripción es obligatoria | API + BD (`sp_AgregarActividad`) |
| R4 | `Abierto → En seguimiento` solo por acción explícita del usuario | BD (`sp_PasarASeguimiento`) |
| R5 | `En seguimiento → Cerrado` requiere al menos una actividad y un motivo no vacío | API + BD (`sp_CerrarExpediente`) |
| R6 | Un expediente cerrado se puede consultar, pero no admite actividades. Su único cambio de estado permitido es la reapertura (R8) _(modificada por la Parte 2)_ | BD + UI (oculta las acciones) |
| R7 | Cada actividad y cada cambio de estado es una entrada independiente; no se editan ni se eliminan | Diseño de BD |
| R8 | **Reabrir** `Cerrado → En seguimiento` exige motivo no vacío; se rechaza si está `Abierto` o `En seguimiento`; conserva id, datos, actividades y **todos** los cierres; agrega un evento al historial con fecha, hora, motivo y transición. Un nuevo cierre exige al menos una actividad posterior a la reapertura y no reemplaza al anterior | API + BD (`sp_ReabrirExpediente`, `sp_CerrarExpediente`) + UI |

### 1.4 Supuestos
- No se puede pasar directamente de `Abierto` a `Cerrado`: el enunciado solo define dos transiciones.
- La actividad que habilita el cierre puede haberse registrado cuando el expediente estaba `Abierto` o `En seguimiento`.
- La búsqueda acepta el código (`EXP-00001`), el id numérico o una parte del nombre/alias, sin distinguir mayúsculas.
- **Parte 2:** después de reabrir, el nuevo cierre exige **al menos una actividad registrada después de la reapertura** (las anteriores ya justificaron el cierre previo). Así lo plantea el recorrido 4: reabrir, agregar una actividad y cerrar de nuevo.
- **Parte 2:** cada cierre se guarda como una fila inmutable en `HistorialEstados` (fecha + motivo). `fechaCierre`/`motivoCierre` del expediente representan solo el cierre **vigente** y vuelven a `null` al reabrir.
- La fecha y hora las asigna el servidor de BD (`SYSDATETIME()`), no el navegador.
- La persistencia es SQL Server. El enunciado dice que basta con localStorage; elegimos SQL Server para aplicar las reglas en un solo lugar (ver Decisiones).

### 1.5 Responsabilidades e integración
| Integrante | Rama | Responsabilidad | Archivos que le pertenecen |
|---|---|---|---|
| **mavasquez** | `feature/mavasquez` | Arquitectura, BD, contrato OpenAPI, integración (merge), README final y comprobaciones. **Parte 2: reapertura** (SP, endpoint y formulario) | `database/`, `docs/openapi.yaml`, `README.md`, `backend/src/routes/reapertura.routes.ts`, `frontend/src/api/reapertura.ts`, `frontend/src/components/ReaperturaForm.tsx` |
| **Daniel** | `feature/Daniel` | API de expedientes: crear, listar/buscar, detalle | `backend/src/routes/expedientes.routes.ts`, `backend/src/services/expedientes.service.ts` |
| **Jaqui** | `feature/Jaqui` | API de seguimiento: actividades, estados, cierre, historial | `backend/src/routes/seguimiento.routes.ts`, `backend/src/services/seguimiento.service.ts` |
| **Dayana** | `feature/Dayana` | UI: listado, búsqueda y formulario de apertura | `frontend/src/pages/ExpedientesPage.tsx`, `NuevoExpedientePage.tsx`, `frontend/src/api/expedientes.ts` |
| **Bagner** | `feature/Bagner` | UI: detalle, historial, actividades, cambio de estado y cierre | `frontend/src/pages/DetalleExpedientePage.tsx`, `frontend/src/components/{Historial,ActividadForm,CierreForm}.tsx`, `frontend/src/api/seguimiento.ts` |

**Forma de integrar:**
1. El contrato `docs/openapi.yaml` se definió al inicio. Backend y frontend trabajan en paralelo contra él.
2. Cada integrante solo modifica sus archivos. Las rutas (`app.ts`, `App.tsx`) ya están conectadas para evitar conflictos.
3. Commits pequeños y descriptivos (`feat(api): ...`, `feat(ui): ...`, `fix: ...`) y Pull Request a `main`. mavasquez revisa y hace el merge.
4. Cada integrante deja su decisión con IA y su comprobación en `docs/aportes/<nombre>.md`, y mavasquez las consolida en este README para no editarlo en paralelo.
5. Plan detallado y prompts: [`docs/PLAN_EQUIPO.md`](docs/PLAN_EQUIPO.md).

---

## 2. Requisitos y ejecución

**Requisitos:** Node.js 20+ · SQL Server 2016+ (Express sirve) con autenticación SQL y TCP 1433 habilitados · `sqlcmd` (opcional).

```bash
# 1) Base de datos (elegir una opción)
sqlcmd -S localhost -E -f 65001 -i database/init.sql      # Windows auth
#   o: cd backend && npm run db:init                      # usa backend/.env
# (opcional) datos de demostración: database/seed.sql  /  npm run db:seed
# ¿Ya tenías la BD creada ANTES de la Parte 2? Aplica la migración (no borra datos):
#   sqlcmd -S localhost -E -f 65001 -i database/migracion_parte2.sql   o: cd backend && npm run db:migrar

# 2) Backend  ->  http://localhost:4000/api/health
cd backend
cp .env.example .env        # ajustar DB_USER / DB_PASSWORD / DB_INSTANCE
npm install
npm run dev

# 3) Frontend ->  http://localhost:5173
cd frontend
npm install
npm run dev
```

**Persistencia:** los datos quedan en SQL Server (BD `BufetePopular`). Se conservan al recargar el navegador y al reiniciar backend y frontend. `init.sql` **reinicia** la BD: no lo vuelvan a ejecutar si quieren conservar los datos.

---

## 3. Decisiones y uso razonado de la IA

| # | Decisión o necesidad | Aporte de la IA | Decisión del equipo y razón | Cómo se comprobó |
|---|---|---|---|---|
| 1 | **Parte 2 — Reabrir expediente.** Cambio: `Cerrado → En seguimiento` con motivo. Impacto: rompía la regla R6, el CHECK de cierre de la tabla y la regla de cierre (contaba actividades de toda la vida) | _Pendiente: completar con lo que propuso la IA (ver `docs/aportes/mavasquez.md`)_ | _Ver `docs/aportes/mavasquez.md`; consolidar aquí_ | _Pendiente: recorrido 4 en la app_ |
| 2 | | | | |
| 3 | | | | |

---

## 4. Lista de comprobación

| Recorrido | Comprobación esperada | Resultado observado | Estado |
|---|---|---|---|
| 1. Apertura | Crear dos expedientes con identificadores distintos; rechazar campos obligatorios incompletos | _Pendiente_ | |
| 2. Consulta | Localizar por identificador y persona, abrir detalle e historial, informar búsqueda sin resultados | _Pendiente_ | |
| 3. Seguimiento y cierre | Agregar actividades, pasar a En seguimiento, cerrar con actividad previa y motivo; rechazar cierres inválidos; bloquear actividades en cerrado | _Pendiente_ | |
| Persistencia | Los datos se conservan al recargar | _Pendiente_ | |
| 4. Reapertura y trazabilidad | Rechazar motivos vacíos y reaperturas en estados incorrectos. Reabrir válidamente, agregar una actividad y cerrar de nuevo. Conservar actividades y ambos cierres con sus fechas y motivos, incluso después de recargar la aplicación | _Pendiente_ | |

**Regresión (Parte 2):** después de integrar la reapertura se repiten los recorridos 1 a 3 y se anota el resultado en las mismas filas.

**Expedientes de demostración:** _Pendiente (códigos usados en las pruebas)._ `seed.sql` deja un expediente **Cerrado** (`Alias Demo C`) listo para demostrar la reapertura.

---

## 5. Limitaciones conocidas
- Sin autenticación ni roles (no se exige).
- No se pueden editar ni eliminar expedientes o actividades (no se exige).
- Requiere SQL Server local; no hay despliegue en internet.
- _Agregar aquí cualquier falla encontrada en las comprobaciones._

## 6. Recursos externos
React, React Router, Vite, Express, mssql (tedious), cors, dotenv. IA usada como apoyo: _(indicar herramientas)_.

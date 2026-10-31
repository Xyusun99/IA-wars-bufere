# Plan de trabajo · Grupo Code Wars 5 · AI Code Wars 2026

Repositorio: https://github.com/Xyusun99/IA-wars-bufere.git
Stack: **SQL Server + Node/Express/TypeScript + React/TypeScript (Vite)**
Contrato único backend ↔ frontend: [`docs/openapi.yaml`](openapi.yaml)

---

## 0. Cómo usar este plan
1. Cada integrante busca **su sección** (Daniel, Jaqui, Dayana, Bagner, mavasquez).
2. Ejecuta los prompts **en orden**, y en cada uno **copia el bloque completo** a su IA.
   - Si su IA tiene acceso al repo (Claude Code, Cursor, Copilot Agent), basta con pegar el prompt: la IA puede leer los archivos.
   - Si usa un chat web (ChatGPT, Gemini, Claude.ai), además debe **adjuntar o pegar** los archivos que lista el prompt en "Archivos de referencia".
3. **Revise lo que propone la IA antes de aceptarlo.** El jurado pregunta a cualquier integrante. Anote qué aceptó, qué cambió y por qué, porque eso vale 30 puntos.
4. Después de cada prompt: **probar → commit → push** (comandos en la sección 2).

---

## 1. Cronograma (90 minutos efectivos)

| Tiempo | Qué pasa | Quién |
|---|---|---|
| **T+0 – 10** | mavasquez sube `main` y las 5 ramas. Todos clonan, instalan, crean `.env` y ejecutan `init.sql`. Este commit inicial ya incluye la **ficha de análisis (hito 1)** | Todos |
| **T+10 – 40** | **Prompt 1** de cada uno → commit + push | Todos |
| **T+40 – 45** | Daniel y Jaqui abren PR → mavasquez hace el merge a `main` **(incluye la reapertura de la Parte 2)**. Todos: `git pull origin main` + **`npm run db:migrar`** una vez | Backend + mavasquez |
| **T+45 – 65** | **Prompt 2**. Dayana y Bagner hacen `git pull origin main` para probar contra la API real → commit + push → PR | Todos |
| **T+65 – 75** | mavasquez hace el merge del frontend. **Todos prueban los recorridos 1 a 4** (el 4 es la reapertura) en la máquina de mavasquez | Todos |
| **T+75 – 82** | **Prompt 3** (aportes: decisión con IA + comprobación) → commit + PR | Todos |
| **T+82 – 88** | mavasquez consolida el README (decisiones, comprobaciones, limitaciones), hace el **commit final** y el tag `v1.0` | mavasquez |
| **T+88 – 90** | Enviar enlace del repo + hash del commit final. App y README abiertos para la demo | mavasquez |

> ⚠️ Si van atrasados, **lo prioritario es que el recorrido funcione** (sección 3 del enunciado). Lo opcional (filtro por estado, categoría, tipo) se omite.

### Parte 2 (reapertura · 10 pts) — qué cambió para cada uno
> Guía completa paso a paso: [`docs/PARTE2_CAMBIOS.md`](PARTE2_CAMBIOS.md)
- **Daniel, Jaqui, Dayana:** nada en su código. Solo `git pull origin main` y `cd backend && npm run db:migrar` (no borra datos; **no** vuelvan a ejecutar `init.sql`).
- **Bagner:** en B2, el paso 4 cambió y el paso 3 usa `actividadesCicloActual` (ver su prompt actualizado).
- **mavasquez:** ya hizo la BD (`sp_ReabrirExpediente`, migración), el endpoint `POST /expedientes/:id/reapertura`, `api/reapertura.ts` y `components/ReaperturaForm.tsx`. Tag `pre-parte2` = commit previo al anuncio.
- `Expediente` trae 3 campos nuevos: `actividadesCicloActual`, `totalCierres`, `totalReaperturas`.

---

## 2. Flujo Git (para todos)

```bash
# Primera vez
git clone https://github.com/Xyusun99/IA-wars-bufere.git code-wars-5
cd code-wars-5
git checkout feature/<TuNombre>          # Daniel | Jaqui | Dayana | Bagner | mavasquez

# Preparar entorno (una vez)
cd backend && cp .env.example .env && npm install && cd ..
cd frontend && npm install && cd ..
sqlcmd -S localhost -E -f 65001 -i database/init.sql   # o: cd backend && npm run db:init
# Si creaste la BD antes de la Parte 2: cd backend && npm run db:migrar   (no borra datos)

# Después de cada prompt
git add .
git commit -m "feat(api): crear y listar expedientes"   # mensaje descriptivo
git push origin feature/<TuNombre>

# Traer lo que ya se integró a main (antes del PR y cuando dependas de otro)
git pull origin main

# Pull Request: en GitHub → Compare & pull request → base: main ← feature/<TuNombre>
```

**Convención de commits:** `feat(api): …` · `feat(ui): …` · `fix: …` · `docs: …` · `test: …`
**Regla de oro:** cada quien solo edita **sus archivos** (tabla 1.5 del README). Si necesitas cambiar un archivo compartido (`openapi.yaml`, `types/index.ts`, `styles.css`, `app.ts`, `App.tsx`), **avisa a mavasquez primero**.

---

## 3. Matriz de calificación → quién la asegura

| Criterio (pts) | Qué evalúan | Responsable principal | Evidencia |
|---|---|---|---|
| Requisitos funcionales (30) | Apertura, consulta, actividades, estados, cierre, persistencia | Daniel, Jaqui, Dayana, Bagner | App funcionando |
| Pruebas y comprobación (10) | Tabla de 3 recorridos con resultado observado | mavasquez + todos | README §4, `docs/aportes/*` |
| Decisiones y alternativas (10) | Tabla de 3 decisiones | mavasquez (consolida) | README §3 |
| Revisión crítica de la IA (10) | Qué se aceptó, modificó o descartó | Cada uno en su Prompt 3 | `docs/aportes/*` |
| Comprensión y explicación (10) | Responder preguntas del jurado | **Todos** (ensayar 1 min) | Demo |
| Análisis del problema (10) | Problema, reglas, prioridades, supuestos | mavasquez | README §1 (hito 1) |
| Responsabilidades e integración (5) | Ramas, PRs, commits progresivos | Todos | Historial Git |
| Información y navegación (5) | Menú, listado → detalle, volver | Dayana, Bagner | UI |
| Legibilidad y consistencia (5) | Mismos estilos, badges, tipografía | Dayana, Bagner (`styles.css`) | UI |
| Formularios y mensajes (5) | Errores por campo, confirmaciones | Dayana, Bagner, Daniel, Jaqui | UI |

---

## 4. Mapa de la arquitectura (para entender el todo)

```
database/init.sql      → tablas, vistas (vw_Expedientes, vw_HistorialExpediente) y SPs con las reglas
                          códigos de error: 50400→400, 50404→404, 50409→409, 50422→422
backend/src/
  app.ts               → monta /api/health y las rutas (YA HECHO)
  config/db.ts         → getPool() y sql (YA HECHO)
  utils/errors.ts      → AppError + traducción de errores SQL (YA HECHO)
  utils/validation.ts  → isBlank(), parseId() (YA HECHO)
  middlewares/errorHandler.ts → responde { error, detalles } (YA HECHO)
  routes/expedientes.routes.ts → DANIEL
  routes/seguimiento.routes.ts → JAQUI
frontend/src/
  App.tsx              → rutas / , /expedientes/nuevo , /expedientes/:id (YA HECHO)
  api/client.ts        → request<T>() y ApiError (YA HECHO)
  types/index.ts       → tipos del contrato (YA HECHO)
  components/Layout, Alert, EstadoBadge; utils/format.ts → formatFecha() (YA HECHO)
  api/expedientes.ts + pages/ExpedientesPage + pages/NuevoExpedientePage → DAYANA
  api/seguimiento.ts + pages/DetalleExpedientePage + components/Historial, ActividadForm, CierreForm → BAGNER
```

---

# 5. PROMPTS POR INTEGRANTE

> Cada bloque `text` se copia completo a la IA.

---

## 👤 mavasquez — Arquitecto e integrador · `feature/mavasquez`

### Prompt M1 — Verificar entorno (T+0)
```text
Actúa como DevOps. Estoy en un monorepo con /database (SQL Server), /backend (Express + TypeScript + mssql)
y /frontend (React + Vite + TS). Necesito dejar el entorno listo en Windows:
1. Explícame cómo habilitar autenticación SQL (modo mixto), el usuario sa y TCP/IP en el puerto 1433 en
   SQL Server 2022 Express (instancia con nombre), o cómo configurar DB_INSTANCE en backend/.env.
2. Revisa backend/src/config/db.ts y backend/.env.example y dime qué valores poner.
3. Dame los comandos para ejecutar database/init.sql con sqlcmd y verificar GET http://localhost:4000/api/health.
No modifiques archivos de otros integrantes. Sé breve y paso a paso.
```
**Commit:** `chore: configuración verificada del entorno` (solo si cambiaste algo, p. ej. el README de ejecución)

### Prompt M2 — Integración (T+40 y T+65)
```text
Actúa como integrador Git. Tengo PRs de feature/Daniel, feature/Jaqui, feature/Dayana y feature/Bagner hacia main.
Cada rama solo debería tocar sus archivos (ver tabla 1.5 del README.md). Dame:
1. Comandos para revisar el diff de cada rama contra main y detectar si alguien tocó archivos ajenos.
2. Cómo resolver un conflicto si aparece en frontend/src/types/index.ts o frontend/src/styles.css
   conservando los cambios de ambos.
3. Una lista de verificación de 2 minutos para probar main después de cada merge
   (npm run typecheck en backend, npm run build en frontend, /api/health, abrir la app).
```

### Prompt M3 — README final (T+82)
```text
Actúa como redactor técnico. Te paso README.md y los archivos docs/aportes/daniel.md, jaqui.md, dayana.md,
bagner.md y mavasquez.md. Necesito:
1. Llenar la tabla "3. Decisiones y uso razonado de la IA" con 3 decisiones. La fila 1 es OBLIGATORIAMENTE
   la reapertura (Parte 2): cambio, impacto, aporte de la IA, solución elegida y cómo se comprobó
   (tomarla de docs/aportes/mavasquez.md). Las otras 2: las más relevantes de los aportes. Columnas: Decisión o necesidad |
   Aporte de la IA | Decisión del equipo y razón (qué aceptamos/modificamos/descartamos) | Cómo se comprobó.
2. Llenar la tabla "4. Lista de comprobación" (recorridos 1 a 4 + persistencia; 1 a 3 repetidos como
   regresión después de la Parte 2) con el resultado OBSERVADO real de los aportes y
   Cumple / Parcial / No cumple. NO inventes resultados: si falta evidencia, pon "Parcial" y explica.
3. Completar "Expedientes de demostración", "Limitaciones conocidas" y "Recursos externos".
No cambies la sección 1 salvo que haya cambiado una decisión o responsabilidad.
```
**Commit final:** `docs: README final con decisiones y comprobaciones` → `git tag v1.0 && git push origin main --tags` → enviar `git rev-parse HEAD`.

**Tu aporte ya está en `docs/aportes/mavasquez.md`.** Revísalo y ajústalo si cambió algo.

---

## 👤 Daniel — API de expedientes · `feature/Daniel`

**Archivos de referencia:** `docs/openapi.yaml`, `database/init.sql`, `backend/src/app.ts`, `backend/src/config/db.ts`, `backend/src/utils/errors.ts`, `backend/src/utils/validation.ts`, `backend/src/routes/expedientes.routes.ts`

### Prompt D1 — Crear, listar/buscar y detalle (T+10)
```text
Actúa como desarrollador backend senior en Node.js + Express 4 + TypeScript (ESM, imports con extensión .js)
con el paquete mssql sobre SQL Server. Proyecto: prototipo de gestión de expedientes de un bufete popular
(datos ficticios). Ya existen:
- backend/src/config/db.ts: export getPool() y export { sql }.
- backend/src/utils/errors.ts: class AppError(status, message, detalles?) y un errorHandler global que
  traduce los THROW de SQL (50400→400, 50404→404, 50409→409, 50422→422).
- backend/src/utils/validation.ts: isBlank(value) y parseId(value).
- En la BD: la vista dbo.vw_Expedientes (columnas camelCase: id, codigo, solicitante, asunto, responsable,
  categoria, estado, fechaApertura, fechaCierre, motivoCierre, totalActividades) y el procedimiento
  dbo.sp_CrearExpediente @Solicitante, @Asunto, @Responsable, @Categoria (devuelve la fila de vw_Expedientes).
- El contrato está en docs/openapi.yaml (tag Expedientes).

Implementa SOLO en backend/src/routes/expedientes.routes.ts (y si quieres separar la lógica,
backend/src/services/expedientes.service.ts):
1. POST /  → valida con isBlank solicitante, asunto y responsable. Si falla alguno, lanza
   AppError(400, 'Revise los campos marcados.', { campo: 'mensaje claro en español' }) con TODOS los
   campos inválidos a la vez. categoria es opcional: null/'' o uno de Civil|Familiar|Laboral; si no, 400.
   Llama a sp_CrearExpediente con parámetros tipados (sql.NVarChar) y responde 201 con recordset[0].
2. GET /?q=&estado= → lista desde vw_Expedientes ORDER BY id DESC. Si viene q (con trim), coincide
   cuando: codigo = q (sin distinguir mayúsculas), o q es numérico e igual al id, o solicitante LIKE
   '%q%'. estado es un filtro opcional. Usa SIEMPRE parámetros (nada de concatenar strings: inyección SQL).
   Responde 200 con un arreglo (vacío si no hay resultados).
3. GET /:id → parseId; si es inválido, 400 'Identificador inválido.'; si no existe, 404
   'El expediente no existe.'; si existe, 200 con el objeto.
Express 4 no captura errores async: envuelve cada handler con try/catch y next(err), o crea un helper
asyncHandler en el mismo archivo. No toques app.ts ni otros archivos. Explícame brevemente cada decisión.
```
**Probar:** `npm run dev` y luego:
```bash
curl -X POST http://localhost:4000/api/expedientes -H "Content-Type: application/json" -d "{\"solicitante\":\"Alias Uno\",\"asunto\":\"Consulta ficticia\",\"responsable\":\"Lic. A\"}"
curl -X POST http://localhost:4000/api/expedientes -H "Content-Type: application/json" -d "{\"solicitante\":\"   \",\"asunto\":\"\",\"responsable\":\"Lic. A\"}"
curl "http://localhost:4000/api/expedientes?q=EXP-00001"
curl "http://localhost:4000/api/expedientes?q=alias"
curl "http://localhost:4000/api/expedientes?q=noexiste"
curl http://localhost:4000/api/expedientes/999
```
**Commit:** `feat(api): crear, listar, buscar y detalle de expedientes`

### Prompt D2 — Revisión crítica y casos borde (T+45)
```text
Revisa críticamente el código que implementamos en backend/src/routes/expedientes.routes.ts (te lo pego).
Busca: (1) campos con solo espacios, tabs o saltos de línea; (2) body vacío o tipos incorrectos
(número en lugar de texto); (3) textos más largos que el límite de la BD (solicitante 150, asunto 500,
responsable 150) → devuelve 400 con un mensaje claro en lugar de un error 500; (4) búsquedas con caracteres
especiales de LIKE (% _ [) → escápalos; (5) que la respuesta coincida EXACTO con docs/openapi.yaml.
Propón solo los cambios necesarios y explica cada uno. Si algo de tu propuesta anterior era innecesario, dilo.
```
**Commit:** `fix(api): validaciones de longitud y búsqueda segura` → push → **abrir PR a main**.

### Prompt D3 — Aporte para el README (T+75)
```text
Escribe docs/aportes/daniel.md (máximo 20 líneas) con:
## Decisión con IA
| Decisión o necesidad | Aporte de la IA | Decisión del equipo y razón | Cómo se comprobó |
(una fila sobre cómo validar los campos obligatorios y devolver errores por campo, o sobre la búsqueda)
## Comprobaciones
Lista de las pruebas curl que hice con su respuesta OBSERVADA (código HTTP y mensaje) y si Cumple/Parcial/No cumple.
Usa estos datos reales: <PEGA AQUÍ LAS RESPUESTAS QUE OBTUVISTE>
```
**Commit:** `docs: aporte de Daniel (decisión y pruebas API expedientes)`

---

## 👤 Jaqui — API de seguimiento · `feature/Jaqui`

**Archivos de referencia:** `docs/openapi.yaml`, `database/init.sql`, `backend/src/app.ts`, `backend/src/config/db.ts`, `backend/src/utils/errors.ts`, `backend/src/utils/validation.ts`, `backend/src/routes/seguimiento.routes.ts`

### Prompt J1 — Actividades, estados, cierre e historial (T+10)
```text
Actúa como desarrollador backend senior en Node.js + Express 4 + TypeScript (ESM, imports con extensión .js)
con mssql sobre SQL Server. Proyecto: prototipo de expedientes de un bufete popular (datos ficticios). Ya existen:
- backend/src/config/db.ts: getPool() y { sql }.
- backend/src/utils/errors.ts: AppError(status, message, detalles?) y un errorHandler global que traduce
  los THROW de SQL: 50400→400, 50404→404, 50409→409, 50422→422 (el mensaje del SP ya viene en español).
- backend/src/utils/validation.ts: isBlank(), parseId().
- BD: vista dbo.vw_HistorialExpediente (expedienteId, orden, tipoEntrada 'ACTIVIDAD'|'ESTADO', fecha,
  descripcion, estadoAnterior, estadoNuevo, motivo, tipoActividad); procedimientos
  dbo.sp_AgregarActividad @ExpedienteId, @Descripcion, @Tipo  (devuelve la actividad)
  dbo.sp_PasarASeguimiento @ExpedienteId                     (devuelve la fila de vw_Expedientes)
  dbo.sp_CerrarExpediente @ExpedienteId, @Motivo              (devuelve la fila de vw_Expedientes)
  Los SPs ya aplican las reglas: solo Abierto→En seguimiento; cerrar solo desde En seguimiento con
  al menos 1 actividad y motivo no vacío; un expediente cerrado no admite actividades.
- Contrato: docs/openapi.yaml (tag Seguimiento). El router se monta en /api/expedientes.

Implementa SOLO en backend/src/routes/seguimiento.routes.ts (opcional: backend/src/services/seguimiento.service.ts):
1. GET /:id/historial → 404 si el expediente no existe (consulta vw_Expedientes); si existe, devuelve
   vw_HistorialExpediente WHERE expedienteId = @id ORDER BY orden ASC.
2. POST /:id/actividades {descripcion, tipo?} → valida descripcion con isBlank ANTES de llamar a la BD:
   AppError(400, 'Revise los campos marcados.', { descripcion: 'La descripción de la actividad es obligatoria.' }).
   Llama al SP y responde 201.
3. POST /:id/seguimiento → llama al SP y responde 200.
4. POST /:id/cierre {motivo} → valida motivo con isBlank (400 con detalles.motivo), llama al SP y responde 200.
En todos: parseId → 400 'Identificador inválido.'. Usa parámetros tipados (sql.Int, sql.NVarChar).
Express 4 no captura errores async: usa try/catch + next(err) o un helper asyncHandler local.
No dupliques en TypeScript las reglas que ya validan los SPs. Explícame por qué esa división es correcta.
No toques app.ts ni archivos de otros.
```
**Probar** (crear antes un expediente con el curl de Daniel o con `npm run db:seed`):
```bash
curl -X POST http://localhost:4000/api/expedientes/2/cierre -H "Content-Type: application/json" -d "{\"motivo\":\"x\"}"        # 409 (está Abierto)
curl -X POST http://localhost:4000/api/expedientes/2/seguimiento                                                          # 200
curl -X POST http://localhost:4000/api/expedientes/2/cierre -H "Content-Type: application/json" -d "{\"motivo\":\"fin\"}"      # 422 (sin actividades)
curl -X POST http://localhost:4000/api/expedientes/2/actividades -H "Content-Type: application/json" -d "{\"descripcion\":\"   \"}" # 400
curl -X POST http://localhost:4000/api/expedientes/2/actividades -H "Content-Type: application/json" -d "{\"descripcion\":\"Llamada de seguimiento\"}" # 201
curl -X POST http://localhost:4000/api/expedientes/2/cierre -H "Content-Type: application/json" -d "{\"motivo\":\"   \"}"      # 400
curl -X POST http://localhost:4000/api/expedientes/2/cierre -H "Content-Type: application/json" -d "{\"motivo\":\"Resuelto\"}" # 200
curl -X POST http://localhost:4000/api/expedientes/2/actividades -H "Content-Type: application/json" -d "{\"descripcion\":\"otra\"}"  # 409
curl http://localhost:4000/api/expedientes/2/historial
```
**Commit:** `feat(api): actividades, cambio de estado, cierre e historial`

### Prompt J2 — Revisión crítica (T+45)
```text
Revisa críticamente backend/src/routes/seguimiento.routes.ts (te lo pego) contra docs/openapi.yaml:
(1) ¿coinciden los códigos HTTP y la forma { error, detalles } en todos los casos?
(2) longitudes: descripción ≤ 1000, tipo ≤ 50, motivo ≤ 500 → 400 claro en vez de 500;
(3) body ausente o descripción numérica; (4) ¿el historial distingue claramente ACTIVIDAD de ESTADO y está
en orden cronológico aunque dos eventos tengan la misma hora? (la columna "orden" sale de una SEQUENCE).
Propón solo cambios necesarios y justifica. Si algo de lo que propusiste antes sobraba, dilo.
```
**Commit:** `fix(api): validaciones de longitud en seguimiento` → push → **abrir PR a main**.

### Prompt J3 — Aporte (T+75)
```text
Escribe docs/aportes/jaqui.md (máximo 20 líneas) con:
## Decisión con IA
| Decisión o necesidad | Aporte de la IA | Decisión del equipo y razón | Cómo se comprobó |
(una fila sobre dónde aplicar las reglas de estado/cierre: SP vs TypeScript, o sobre el orden del historial)
## Comprobaciones
Cada curl con la respuesta OBSERVADA (código y mensaje) y Cumple/Parcial/No cumple.
Datos reales: <PEGA AQUÍ LAS RESPUESTAS>
```
**Commit:** `docs: aporte de Jaqui (decisión y pruebas de seguimiento)`

---

## 👤 Dayana — UI listado, búsqueda y apertura · `feature/Dayana`

**Archivos de referencia:** `docs/openapi.yaml`, `frontend/src/api/client.ts`, `frontend/src/types/index.ts`, `frontend/src/components/{Alert,EstadoBadge,Layout}.tsx`, `frontend/src/utils/format.ts`, `frontend/src/styles.css`, `frontend/src/App.tsx`, `frontend/src/pages/ExpedientesPage.tsx`, `frontend/src/pages/NuevoExpedientePage.tsx`, `frontend/src/api/expedientes.ts`

### Prompt Y1 — API cliente + formulario de apertura (T+10)
```text
Actúa como desarrollador frontend senior en React 18 + TypeScript + React Router 6 (Vite). Proyecto: prototipo
de expedientes de un bufete popular con datos ficticios. Ya existen:
- frontend/src/api/client.ts: request<T>(path, options) que llama a /api{path} y lanza ApiError
  { status, message, detalles?: Record<string,string> }.
- frontend/src/types/index.ts: Expediente, NuevoExpediente, Categoria, Estado.
- Componentes: Alert ({tipo:'exito'|'error'|'info'}), EstadoBadge ({estado}); utils/format.ts: formatFecha(iso).
- Clases CSS en styles.css: .card .form .field .field--error .field__error .hint .required .btn .btn--primary
  .alert .table .table-wrap .toolbar .muted. NO agregues librerías ni CSS nuevo salvo que sea indispensable.
- Ruta ya definida en App.tsx: /expedientes/nuevo → NuevoExpedientePage.

Implementa:
1. frontend/src/api/expedientes.ts:
   listarExpedientes(q?: string, estado?: Estado): Promise<Expediente[]>  → GET /expedientes?q=&estado= (URLSearchParams)
   crearExpediente(data: NuevoExpediente): Promise<Expediente>           → POST /expedientes
2. frontend/src/pages/NuevoExpedientePage.tsx: formulario dentro de .card con:
   - Nombre ficticio o alias de la persona solicitante* (input), Descripción breve del asunto* (textarea),
     Nombre del responsable* (input), Categoría (select opcional: — Sin categoría —, Civil, Familiar, Laboral).
   - Texto de ayuda: "Use solo datos ficticios. No ingrese documentos de identificación."
   - Validación en cliente con trim(): mostrar debajo de CADA campo inválido qué corregir
     (ej. "Ingrese el nombre o alias del solicitante.") y un Alert de error arriba. No enviar si hay errores.
   - Si el backend devuelve ApiError con detalles, mostrarlos en los campos correspondientes.
   - Botón deshabilitado mientras se envía ("Guardando...").
   - Al crear: navigate(`/expedientes/${exp.id}`, { state: { mensaje: `Expediente ${exp.codigo} creado correctamente.` } })
     (Bagner mostrará ese mensaje en el detalle). Botón "Cancelar" que vuelve a "/".
Usa labels con htmlFor y aria-invalid. Explica brevemente tus decisiones. No toques otros archivos.
```
**Probar:** `npm run dev` en backend y frontend → crear expediente, enviar con espacios y verificar los mensajes.
**Commit:** `feat(ui): formulario de apertura con validación por campo`

### Prompt Y2 — Listado y búsqueda (T+45)
```text
Sigue en el mismo proyecto. Implementa frontend/src/pages/ExpedientesPage.tsx:
- Título "Expedientes" y botón "Nuevo expediente" (Link a /expedientes/nuevo).
- .toolbar con input de búsqueda (placeholder "Buscar por identificador (EXP-00001) o nombre/alias") y
  botones "Buscar" y "Limpiar". Enviar con Enter (form onSubmit). Filtro opcional: select de estado.
- Tabla .table dentro de .table-wrap con columnas: Identificador (codigo), Persona, Responsable, Estado
  (EstadoBadge), Apertura (formatFecha). Cada fila es clickeable (y accesible con teclado) y navega a
  /expedientes/:id. El código debe ser un Link.
- Estados de la vista: "Cargando...", error con Alert (incluye el caso de backend apagado),
  y si no hay resultados: Alert info 'No se encontraron expedientes para "<texto>".' o, sin búsqueda,
  "Aún no hay expedientes. Cree el primero."
- Mostrar el total de resultados.
Usa listarExpedientes de api/expedientes.ts. Luego revisa críticamente tu propio código: ¿qué pasa si el
usuario busca muy rápido dos veces (condición de carrera)? Corrígelo de forma simple.
```
**Commit:** `feat(ui): listado y búsqueda de expedientes` → `git pull origin main` → probar con la API real → push → **PR a main**.

### Prompt Y3 — Aporte (T+75)
```text
Escribe docs/aportes/dayana.md (máximo 20 líneas) con:
## Decisión con IA
| Decisión o necesidad | Aporte de la IA | Decisión del equipo y razón | Cómo se comprobó |
(una fila sobre la validación y los mensajes del formulario, o sobre la búsqueda y el estado "sin resultados")
## Comprobaciones (Recorrido 1 Apertura y Recorrido 2 Consulta)
Lo que hice en la UI y lo que OBSERVÉ, con Cumple/Parcial/No cumple: <DESCRIBE TUS PRUEBAS>
```
**Commit:** `docs: aporte de Dayana (decisión y pruebas UI apertura/consulta)`

---

## 👤 Bagner — UI detalle, historial, actividades y cierre · `feature/Bagner`

**Archivos de referencia:** `docs/openapi.yaml`, `frontend/src/api/client.ts`, `frontend/src/types/index.ts`, `frontend/src/components/{Alert,EstadoBadge}.tsx`, `frontend/src/utils/format.ts`, `frontend/src/styles.css`, `frontend/src/pages/DetalleExpedientePage.tsx`, `frontend/src/api/seguimiento.ts`

### Prompt B1 — API cliente + detalle + historial (T+10)
```text
Actúa como desarrollador frontend senior en React 18 + TypeScript + React Router 6 (Vite). Proyecto: prototipo
de expedientes de un bufete popular con datos ficticios. Ya existen:
- frontend/src/api/client.ts: request<T>(path, options) → /api{path}; lanza ApiError {status, message, detalles?}.
- frontend/src/types/index.ts: Expediente, EntradaHistorial, Actividad, NuevaActividad, Estado.
- Componentes Alert ({tipo:'exito'|'error'|'info'}), EstadoBadge ({estado}); utils/format.ts formatFecha(iso).
- CSS en styles.css: .card .btn .btn--primary .btn--danger .form .field .field--error .field__error
  .alert .muted .timeline .timeline__item .timeline__item--estado .timeline__meta. NO agregues librerías.
- Ruta /expedientes/:id → DetalleExpedientePage (ya en App.tsx).

Implementa:
1. frontend/src/api/seguimiento.ts:
   obtenerExpediente(id) GET /expedientes/:id · obtenerHistorial(id) GET /expedientes/:id/historial ·
   agregarActividad(id, data) POST /expedientes/:id/actividades · pasarASeguimiento(id) POST /expedientes/:id/seguimiento ·
   cerrarExpediente(id, motivo) POST /expedientes/:id/cierre
2. frontend/src/components/Historial.tsx: recibe EntradaHistorial[] y la muestra como lista .timeline en orden
   cronológico (como viene de la API). Distingue visualmente ACTIVIDAD (etiqueta "Actividad" + tipo si existe)
   de ESTADO (clase timeline__item--estado, etiqueta "Cambio de estado"; si tiene motivo, mostrar "Motivo: ...").
   Mostrar fecha con formatFecha. Si está vacío: "Sin movimientos".
3. frontend/src/pages/DetalleExpedientePage.tsx: con useParams carga expediente e historial
   (función recargar() reutilizable). Muestra en .card: código, EstadoBadge, solicitante, asunto, responsable,
   categoría, fecha de apertura y, si está cerrado, fecha y motivo de cierre. Link "← Volver al listado".
   Si location.state?.mensaje existe, mostrarlo en un Alert 'exito' (viene de la creación del expediente).
   Estados: "Cargando...", 404 → Alert "El expediente no existe" + link al listado.
Explica tus decisiones brevemente. No toques archivos de otros.
```
**Commit:** `feat(ui): detalle de expediente e historial cronológico`

### Prompt B2 — Actividades, seguimiento y cierre (T+45)
```text
Sigue en el mismo proyecto. Agrega acciones al detalle:
1. frontend/src/components/ActividadForm.tsx (props: expedienteId, onCreada): textarea "Descripción de la
   actividad*" + input opcional "Tipo" (o select: Llamada, Reunión, Documento, Audiencia, Otro). Validar con
   trim() y mostrar "Ingrese la descripción de la actividad." bajo el campo. Al guardar: limpiar el form,
   Alert 'exito' "Actividad registrada." y llamar onCreada() para recargar el historial.
2. Botón "Pasar a En seguimiento" visible solo si estado === 'Abierto', con window.confirm antes de ejecutar.
   Al terminar: Alert de éxito y recargar.
3. frontend/src/components/CierreForm.tsx visible solo si estado === 'En seguimiento': textarea "Motivo de cierre*".
   Si actividadesCicloActual === 0 (actividades desde la última reapertura), mostrar el aviso
   "Debe registrar al menos una actividad antes de cerrar" y deshabilitar el botón. Validar el motivo con trim(). Confirmar antes de cerrar. Mostrar cualquier
   ApiError del backend (409/422/400) en un Alert de error.
4. (PARTE 2) Si estado === 'Cerrado': ocultar ActividadForm, el botón de seguimiento y CierreForm; mostrar
   un Alert info "Expediente cerrado: no admite nuevas actividades. Puede reabrirlo si recibió nueva
   información." y debajo el componente YA HECHO:
     import ReaperturaForm from '../components/ReaperturaForm';
     <ReaperturaForm expedienteId={exp.id} onReabierto={() => { setMensaje('Expediente reabierto.'); recargar(); }} />
5. (PARTE 2) En la ficha, si totalCierres > 0 mostrar "Cierres registrados: N". Si fechaCierre es null pero
   totalCierres > 0, el expediente fue reabierto: los cierres anteriores (fecha y motivo) se ven en el historial.
   En Historial.tsx, una entrada ESTADO con estadoAnterior === 'Cerrado' es una reapertura: etiqueta "Reapertura".
6. Revisa críticamente: aunque la UI oculte botones, ¿qué protege la regla si alguien llama la API?
   (respuesta esperada: los SPs de la BD). Explícalo en 2 líneas para la demo.
```
**Commit:** `feat(ui): actividades, cambio a seguimiento y cierre con validaciones` → `git pull origin main` → probar → push → **PR a main**.

### Prompt B3 — Aporte (T+75)
```text
Escribe docs/aportes/bagner.md (máximo 20 líneas) con:
## Decisión con IA
| Decisión o necesidad | Aporte de la IA | Decisión del equipo y razón | Cómo se comprobó |
(una fila sobre cómo distinguir actividades de cambios de estado en el historial, o sobre bloquear acciones en cerrado)
## Comprobaciones (Recorrido 3 Seguimiento y cierre, Recorrido 4 Reapertura + persistencia al recargar)
Lo que hice y lo que OBSERVÉ, con Cumple/Parcial/No cumple: <DESCRIBE TUS PRUEBAS>
```
**Commit:** `docs: aporte de Bagner (decisión y pruebas de seguimiento/cierre)`

---

## 6. Guion de demo (3 min incluida la transición) — ensayarlo una vez
1. (Dayana) Crear un expediente con un campo en blanco → error por campo → corregir → éxito con código.
2. (Dayana) Buscar por código, buscar por alias, buscar "zzz" → sin resultados.
3. (Bagner) Abrir el detalle → agregar actividad → pasar a En seguimiento → intentar cerrar sin motivo → cerrar con motivo → ver que ya no se pueden agregar actividades → historial.
4. (mavasquez) **Reapertura:** en el expediente cerrado → reabrir con motivo vacío (rechazo) → reabrir con
   motivo → agregar actividad → cerrar de nuevo → historial con **ambos cierres** y la reapertura.
   (Si falta tiempo, usar `Alias Demo C` del seed, que ya está Cerrado.)
5. (Cualquiera) Recargar con F5 → los datos y ambos cierres siguen ahí.
6. (mavasquez o Jaqui) Explicar **una decisión** (ideal: la reapertura sin perder cierres, o) y cómo se comprobó: reglas en los SPs + prueba de cierre inválido.

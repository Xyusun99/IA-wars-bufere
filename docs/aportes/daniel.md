# Aporte de Daniel (API de expedientes)

## Decisión con IA
| Decisión o necesidad | Aporte de la IA | Decisión del equipo y razón | Cómo se comprobó |
|---|---|---|---|
| Validar la apertura y hacer segura la búsqueda sin duplicar las reglas de `sp_CrearExpediente` | El plan proponía `isBlank` y `parseId` en la ruta. La revisión con IA señaló que `parseId` acepta `1e3` y `0x10`, y que un número mayor que `INT` no cabe en el parámetro; también que `%`, `_` y `[` actúan como comodines de `LIKE` | **Aceptamos** los errores por campo con todos los campos a la vez y el escape de `LIKE`. **Modificamos** la validación de id: `aIdEntero` solo admite dígitos dentro del rango de `INT`. **Separamos** las consultas en `expedientes.service.ts`, como indica el README. La apertura sigue en el procedimiento almacenado | Pruebas HTTP contra SQL Server (abajo): 46 de 47 correctas |

## Comprobaciones (31/10/2026, API local y SQL Server Express)
`npm run typecheck` y `npm run build` del backend: sin errores (Cumple).

| Prueba | Resultado observado | Estado |
|---|---|---|
| `POST` válido, con categoría y sin ella (`null`, `''` u omitida) | 201, `EXP-00001` a `EXP-00004`, estado `Abierto`, ids distintos | Cumple |
| `POST` con espacios, tabs, saltos, vacío, sin body, arreglo o número | 400 "Revise los campos marcados." con `detalles` por cada campo inválido | Cumple |
| `POST` con categoría `Penal` o `7` | 400 con `detalles.categoria` | Cumple |
| Longitud: 150 caracteres; 151 en solicitante o responsable; 501 en asunto | 201 sin recortar; 400 con mensaje del campo | Cumple |
| Solicitudes rechazadas | No guardaron filas: el listado siguió con 5 | Cumple |
| `POST` con JSON mal formado | **500** "Ocurrió un error inesperado." (esperado 400). Ocurre en `errorHandler.ts`, archivo compartido | No cumple |
| `GET` sin filtros | 200, 5 expedientes, id descendente | Cumple |
| `q` = código (mayúsculas y minúsculas), id, parte del alias, `josé`, con espacios | 200, encuentra el expediente correcto | Cumple |
| `q=zzz` | 200 `[]` | Cumple |
| `q` = `%` o `_`; `[`; `' OR 1=1 --` | Texto literal: 1 coincidencia real; 0; 0 | Cumple |
| `q=99999999999`, `q=1e3`, `q` repetido | 200, sin error 500 | Cumple |
| `estado` = `Abierto`, `En seguimiento`, `Foo`; `q` + `estado` | 200, filtra; lista vacía si el estado no coincide | Cumple |
| `GET /:id` existente / `999999` | 200 / 404 "El expediente no existe." | Cumple |
| `GET /:id` con `abc`, `0`, `-1`, `1.5`, `1e3`, `0x10`, `99999999999` | 400 "Identificador inválido." | Cumple |
| Reiniciar el backend y repetir la búsqueda | Los datos se conservan | Cumple |
| Fecha de apertura | **Desfase de 6 horas:** creado a las 9:13 a. m., devuelto como `09:13:49.517Z` y leído como 3:13 a. m. Ocurre en `config/db.ts`, archivo compartido | No cumple |

## Parte 2: compatibilidad y regresión (31/10/2026, 09:24)
**Revisado:** `migracion_parte2.sql`, `openapi.yaml` (esquema `Expediente`) y mis consultas, sobre `main` en `fe9885c`. La migración se aplicó con Windows Authentication y conservó los datos: 5 expedientes y 5 entradas de historial antes y después.

**Cambios necesarios en mis archivos: ninguno.** Las consultas usan `SELECT *` sobre `vw_Expedientes`, y `POST`, `GET /` y `GET /:id` devuelven `actividadesCicloActual`, `totalCierres` y `totalReaperturas` como enteros. Los nombres y tipos de todos los campos coinciden con el esquema (`typecheck` y `build` sin errores).

| Recorrido | Vía | Resultado observado | Estado |
|---|---|---|---|
| 1. Apertura | API | `EXP-00006` y `EXP-00007` con 201; vacíos, espacios y tab con 400 por campo | Cumple |
| 2. Consulta | API | Código e id: 1 resultado; alias: 2; sin coincidencias: `[]`; detalle: 200, 404 y 400. El historial no se pudo abrir (404, API de seguimiento no integrada) | Parcial |
| 3. Seguimiento y cierre | API | `historial`, `actividades`, `seguimiento` y `cierre` responden 404: en `fe9885c` no está la API de Jaqui | No verificable |
| 4. Rechazos de reapertura | API | Abierto y En seguimiento: 409; inexistente: 404; motivo vacío o con espacios: 400; reabrir dos veces: 409 | Cumple |
| 4. Reapertura válida | API | 200, `EXP-00008` En seguimiento, mismo id y código; `GET /` y `GET /:id`: ciclo 0, cierres 1, reaperturas 1; `fechaCierre` y `motivoCierre` en `null` | Cumple |
| 4. Actividad y nuevo cierre | **SQL** | Sin actividad nueva: error 50422; con actividad: cierra. `GET /:id`: ciclo 1, cierres 2, reaperturas 1 | Parcial (no probado por API) |
| 4. Trazabilidad | **SQL** | `vw_HistorialExpediente` conserva 2 actividades, ambos cierres y la reapertura, con fecha y motivo | Parcial (no probado por API) |
| Persistencia | API | Tras reiniciar el backend, `EXP-00008` sigue Cerrado con cierres 2 y reaperturas 1 | Cumple |

**Preparación por SQL en el recorrido 4:** pasar a En seguimiento, agregar actividades y cerrar se hizo con los procedimientos almacenados, porque la API de seguimiento no estaba integrada.

**No ejecutado:**
- Recorridos 3 y 4 desde la interfaz, y recarga en el navegador: no se levantó el frontend y falta la API de seguimiento.
- Historial por API: depende de la API de Jaqui.

**Problemas encontrados:**
- El desfase de 6 horas sigue: `EXP-00008` se creó a las 9:24 a. m. y se devuelve como `09:24:51.606Z`, que se lee como 3:24 a. m. (`config/db.ts`, archivo compartido).
- El `500` por JSON mal formado no se repitió en esta ronda. `errorHandler.ts` no cambió, así que sigue pendiente.

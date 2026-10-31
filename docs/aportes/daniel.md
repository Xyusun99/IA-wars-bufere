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

**No comprobado:** los campos de la Parte 2 (la BD local no tiene la migración) ni el recorrido desde la interfaz.

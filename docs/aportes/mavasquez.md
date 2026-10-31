# Aporte de mavasquez (arquitectura e integración)

## Decisión con IA
| Decisión o necesidad | Aporte de la IA | Decisión del equipo y razón | Cómo se comprobó |
|---|---|---|---|
| Dónde guardar los datos y dónde aplicar las reglas de estados y cierre | Alternativas que se analizaron: (a) localStorage, que basta según el enunciado; (b) reglas solo en TypeScript; (c) SQL Server con las reglas en procedimientos almacenados con transacción y `UPDLOCK`. La IA recomendó (c), además de validar en la API y en la UI para dar mensajes claros | **Aceptamos (c) y la modificamos.** Agregamos `TRY/CATCH` con `ROLLBACK` cuando la primera versión dejaba transacciones abiertas (error 3930), y una `SEQUENCE` compartida para ordenar el historial aunque dos eventos tengan la misma hora. Descartamos localStorage porque el equipo pidió SQL Server y así las reglas viven en un solo lugar que ninguna ruta puede saltarse | Script T-SQL: crear con alias de solo espacios → 50400; cerrar sin actividades → 50422; cerrar con motivo de solo espacios → 50400; agregar actividad a un expediente cerrado → 50409; `@@TRANCOUNT` = 0 después de los errores; el historial sale en orden apertura → actividad → cambio de estado |

## Parte 2 · Decisión con IA (reapertura)
| Decisión o necesidad | Aporte de la IA | Decisión del equipo y razón | Cómo se comprobó |
|---|---|---|---|
| Reabrir `Cerrado → En seguimiento` sin perder cierres previos, y llegó cuando el equipo ya estaba programando | La IA detectó 3 impactos: (1) el CHECK `CK_Expedientes_Cierre` impedía reabrir; (2) `sp_CerrarExpediente` sobrescribía fecha y motivo, así que solo cabía un cierre; (3) el cierre contaba actividades de toda la vida y permitía volver a cerrar sin trabajo nuevo. Propuso dos alternativas: quitar el CHECK y guardar el último cierre en las columnas, o mantener el CHECK, limpiar el cierre vigente y conservar todos los cierres en `HistorialEstados` | **Aceptamos la segunda:** no cambia la tabla y el historial ya es inmutable. **Decidimos** que el nuevo cierre exija una actividad posterior a la reapertura (columna `actividadesCicloActual`). **Modificamos** la entrega: migración `CREATE OR ALTER` en lugar de volver a ejecutar `init.sql`, que borraba los datos de prueba del equipo, y archivos nuevos (`reapertura.routes.ts`, `ReaperturaForm.tsx`) para no tocar los de Daniel, Jaqui, Dayana ni Bagner. Se conservó el commit previo con el tag `pre-parte2` | Script T-SQL sobre una BD creada con el `init.sql` **anterior** y con datos, después de migrar: motivo con espacios o NULL → 50400; reabrir Abierto o En seguimiento → 50409; inexistente → 50404; reabrir dos veces → 50409; actividad en Cerrado → 50409; cerrar sin actividad nueva → 50422; reabrir, agregar actividad y cerrar → historial con **ambos** cierres y sus motivos; `@@TRANCOUNT` = 0. HTTP: 400/400/404/409/409/200 en `POST /reapertura` |

## Comprobaciones
- `init.sql` y `seed.sql` se ejecutan sin errores en SQL Server 2022 Express (Cumple).
- Backend: `npm run typecheck` sin errores. Frontend: `npm run build` sin errores (Cumple).
- Parte 2: `migracion_parte2.sql` se ejecuta sin errores sobre una BD con datos creada con el `init.sql` anterior, y se puede repetir. `init.sql` + `seed.sql` nuevos también funcionan (Cumple).
- Parte 2: `npm run typecheck` (backend) y `npm run build` (frontend) sin errores con el endpoint y el formulario nuevos (Cumple).
- Pendiente: recorrido 4 completo en la UI (requiere el detalle de Bagner integrado).

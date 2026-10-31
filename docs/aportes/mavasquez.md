# Aporte de mavasquez (arquitectura e integración)

## Decisión con IA
| Decisión o necesidad | Aporte de la IA | Decisión del equipo y razón | Cómo se comprobó |
|---|---|---|---|
| Dónde guardar los datos y dónde aplicar las reglas de estados y cierre | Alternativas que se analizaron: (a) localStorage, que basta según el enunciado; (b) reglas solo en TypeScript; (c) SQL Server con las reglas en procedimientos almacenados con transacción y `UPDLOCK`. La IA recomendó (c), además de validar en la API y en la UI para dar mensajes claros | **Aceptamos (c) y la modificamos.** Agregamos `TRY/CATCH` con `ROLLBACK` cuando la primera versión dejaba transacciones abiertas (error 3930), y una `SEQUENCE` compartida para ordenar el historial aunque dos eventos tengan la misma hora. Descartamos localStorage porque el equipo pidió SQL Server y así las reglas viven en un solo lugar que ninguna ruta puede saltarse | Script T-SQL: crear con alias de solo espacios → 50400; cerrar sin actividades → 50422; cerrar con motivo de solo espacios → 50400; agregar actividad a un expediente cerrado → 50409; `@@TRANCOUNT` = 0 después de los errores; el historial sale en orden apertura → actividad → cambio de estado |

## Comprobaciones
- `init.sql` y `seed.sql` se ejecutan sin errores en SQL Server 2022 Express (Cumple).
- Backend: `npm run typecheck` sin errores. Frontend: `npm run build` sin errores (Cumple).

/* =====================================================================
   PARTE 2 - Reapertura de expedientes (migración SIN pérdida de datos)
   ---------------------------------------------------------------------
   Para quien ya ejecutó init.sql y tiene datos de prueba. NO borra nada:
   solo reemplaza vistas y procedimientos con CREATE OR ALTER.
     sqlcmd -S localhost -E -f 65001 -i database/migracion_parte2.sql
   o: cd backend && npm run db:migrar
   Una instalación nueva NO lo necesita: init.sql ya incluye estos cambios.
   Se puede ejecutar varias veces.
   ===================================================================== */
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
USE BufetePopular;
GO

CREATE OR ALTER VIEW dbo.vw_Expedientes AS
SELECT
    e.Id            AS id,
    e.Codigo        AS codigo,
    e.Solicitante   AS solicitante,
    e.Asunto        AS asunto,
    e.Responsable   AS responsable,
    e.Categoria     AS categoria,
    e.Estado        AS estado,
    e.FechaApertura AS fechaApertura,
    e.FechaCierre   AS fechaCierre,
    e.MotivoCierre  AS motivoCierre,
    (SELECT COUNT(*) FROM dbo.Actividades a WHERE a.ExpedienteId = e.Id) AS totalActividades,
    -- Actividades registradas después de la última reapertura (o desde la apertura
    -- si nunca se reabrió). Es lo que exige el cierre: >= 1.
    (SELECT COUNT(*) FROM dbo.Actividades a
      WHERE a.ExpedienteId = e.Id
        AND a.Orden > ISNULL((SELECT MAX(h.Orden) FROM dbo.HistorialEstados h
                               WHERE h.ExpedienteId = e.Id AND h.EstadoAnterior = N'Cerrado'), 0)
    ) AS actividadesCicloActual,
    (SELECT COUNT(*) FROM dbo.HistorialEstados h WHERE h.ExpedienteId = e.Id AND h.EstadoNuevo = N'Cerrado') AS totalCierres,
    (SELECT COUNT(*) FROM dbo.HistorialEstados h WHERE h.ExpedienteId = e.Id AND h.EstadoAnterior = N'Cerrado') AS totalReaperturas
FROM dbo.Expedientes e;
GO

/* Historial unificado: distingue ACTIVIDAD de ESTADO. Ordenar por "orden". */
CREATE OR ALTER VIEW dbo.vw_HistorialExpediente AS
SELECT
    h.ExpedienteId AS expedienteId,
    h.Orden        AS orden,
    N'ESTADO'      AS tipoEntrada,
    h.Fecha        AS fecha,
    CASE WHEN h.EstadoAnterior IS NULL
         THEN N'Apertura del expediente (estado Abierto)'
         WHEN h.EstadoAnterior = N'Cerrado'
         THEN N'Reapertura del expediente: Cerrado -> ' + h.EstadoNuevo
         ELSE N'Cambio de estado: ' + h.EstadoAnterior + N' -> ' + h.EstadoNuevo
    END            AS descripcion,
    h.EstadoAnterior AS estadoAnterior,
    h.EstadoNuevo    AS estadoNuevo,
    h.Motivo         AS motivo,
    CAST(NULL AS NVARCHAR(50)) AS tipoActividad
FROM dbo.HistorialEstados h
UNION ALL
SELECT
    a.ExpedienteId, a.Orden, N'ACTIVIDAD', a.Fecha, a.Descripcion,
    NULL, NULL, NULL, a.Tipo
FROM dbo.Actividades a;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CerrarExpediente
    @ExpedienteId INT,
    @Motivo       NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;

    SET @Motivo = LTRIM(RTRIM(@Motivo));

    BEGIN TRY
    BEGIN TRAN;
        DECLARE @Estado NVARCHAR(20);
        SELECT @Estado = Estado FROM dbo.Expedientes WITH (UPDLOCK, HOLDLOCK) WHERE Id = @ExpedienteId;

        IF @Estado IS NULL              THROW 50404, N'El expediente no existe.', 1;
        IF @Estado <> N'En seguimiento' THROW 50409, N'Solo un expediente En seguimiento puede cerrarse.', 1;

        -- Parte 2: si fue reabierto, la actividad exigida debe ser POSTERIOR a la última reapertura.
        DECLARE @UltimaReapertura BIGINT =
            (SELECT MAX(Orden) FROM dbo.HistorialEstados
              WHERE ExpedienteId = @ExpedienteId AND EstadoAnterior = N'Cerrado');
        IF NOT EXISTS (SELECT 1 FROM dbo.Actividades
                        WHERE ExpedienteId = @ExpedienteId AND Orden > ISNULL(@UltimaReapertura, 0))
        BEGIN
            IF @UltimaReapertura IS NULL
                THROW 50422, N'Debe registrar al menos una actividad antes de cerrar el expediente.', 1;
            ELSE
                THROW 50422, N'Debe registrar al menos una actividad después de la reapertura antes de volver a cerrar.', 1;
        END;
        IF @Motivo IS NULL OR @Motivo = N'' THROW 50400, N'El motivo de cierre es obligatorio.', 1;

        UPDATE dbo.Expedientes
           SET Estado = N'Cerrado', FechaCierre = SYSDATETIME(), MotivoCierre = @Motivo
         WHERE Id = @ExpedienteId;
        -- Cada cierre es una fila nueva: un segundo cierre NO reemplaza al anterior.
        INSERT INTO dbo.HistorialEstados (ExpedienteId, EstadoAnterior, EstadoNuevo, Motivo)
        VALUES (@ExpedienteId, N'En seguimiento', N'Cerrado', @Motivo);
    COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH;

    SELECT * FROM dbo.vw_Expedientes WHERE id = @ExpedienteId;
END;
GO

/* Parte 2: Cerrado -> En seguimiento. Conserva id, datos, actividades y los
   cierres previos (filas de HistorialEstados); agrega el evento de reapertura. */
CREATE OR ALTER PROCEDURE dbo.sp_ReabrirExpediente
    @ExpedienteId INT,
    @Motivo       NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;

    SET @Motivo = LTRIM(RTRIM(@Motivo));

    BEGIN TRY
    BEGIN TRAN;
        DECLARE @Estado NVARCHAR(20);
        SELECT @Estado = Estado FROM dbo.Expedientes WITH (UPDLOCK, HOLDLOCK) WHERE Id = @ExpedienteId;

        IF @Estado IS NULL       THROW 50404, N'El expediente no existe.', 1;
        IF @Estado <> N'Cerrado' THROW 50409, N'Solo un expediente Cerrado puede reabrirse.', 1;
        IF @Motivo IS NULL OR @Motivo = N'' THROW 50400, N'El motivo de reapertura es obligatorio.', 1;

        -- Solo se limpia el cierre VIGENTE; el historial conserva todos los cierres.
        UPDATE dbo.Expedientes
           SET Estado = N'En seguimiento', FechaCierre = NULL, MotivoCierre = NULL
         WHERE Id = @ExpedienteId;
        INSERT INTO dbo.HistorialEstados (ExpedienteId, EstadoAnterior, EstadoNuevo, Motivo)
        VALUES (@ExpedienteId, N'Cerrado', N'En seguimiento', @Motivo);
    COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH;

    SELECT * FROM dbo.vw_Expedientes WHERE id = @ExpedienteId;
END;
GO

PRINT N'Migración Parte 2 (reapertura) aplicada correctamente.';
GO

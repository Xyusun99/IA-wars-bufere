/* =====================================================================
   Bufete Popular - Prototipo de gestión de expedientes (DATOS FICTICIOS)
   Script de inicialización para SQL Server 2016+
   ---------------------------------------------------------------------
   Ejecutar (desde la raíz del repo):
     sqlcmd -S localhost -U sa -P "TuPassword" -f 65001 -i database/init.sql
   o con autenticación de Windows:
     sqlcmd -S localhost -E -f 65001 -i database/init.sql
   o desde el backend:
     cd backend && npm run db:init
   El script es idempotente: borra y vuelve a crear los objetos.
   ===================================================================== */
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;  -- requerido por la columna calculada indexada (Codigo)
GO

IF DB_ID(N'BufetePopular') IS NULL
    CREATE DATABASE BufetePopular;
GO

USE BufetePopular;
GO

/* ---------- Limpieza (orden inverso a dependencias) ---------- */
DROP VIEW IF EXISTS dbo.vw_HistorialExpediente;
DROP VIEW IF EXISTS dbo.vw_Expedientes;
DROP PROCEDURE IF EXISTS dbo.sp_CrearExpediente;
DROP PROCEDURE IF EXISTS dbo.sp_AgregarActividad;
DROP PROCEDURE IF EXISTS dbo.sp_PasarASeguimiento;
DROP PROCEDURE IF EXISTS dbo.sp_CerrarExpediente;
DROP PROCEDURE IF EXISTS dbo.sp_ReabrirExpediente;
DROP TABLE IF EXISTS dbo.HistorialEstados;
DROP TABLE IF EXISTS dbo.Actividades;
DROP TABLE IF EXISTS dbo.Expedientes;
DROP SEQUENCE IF EXISTS dbo.SeqHistorial;
GO

/* Secuencia compartida: garantiza orden cronológico estable entre
   actividades y cambios de estado aunque tengan la misma fecha/hora. */
CREATE SEQUENCE dbo.SeqHistorial AS BIGINT START WITH 1 INCREMENT BY 1;
GO

/* ============================ TABLAS ============================ */
CREATE TABLE dbo.Expedientes (
    Id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Expedientes PRIMARY KEY,
    -- Identificador único legible generado automáticamente: EXP-00001
    Codigo        AS (N'EXP-' + RIGHT(N'00000' + CAST(Id AS NVARCHAR(10)), 5)) PERSISTED,
    Solicitante   NVARCHAR(150) NOT NULL,   -- nombre ficticio o alias
    Asunto        NVARCHAR(500) NOT NULL,   -- descripción breve
    Responsable   NVARCHAR(150) NOT NULL,
    Categoria     NVARCHAR(20)  NULL,       -- opcional
    Estado        NVARCHAR(20)  NOT NULL CONSTRAINT DF_Expedientes_Estado DEFAULT (N'Abierto'),
    FechaApertura DATETIME2(3)  NOT NULL CONSTRAINT DF_Expedientes_Fecha DEFAULT (SYSDATETIME()),
    -- Cierre VIGENTE. Al reabrir se limpian; TODOS los cierres (con fecha y
    -- motivo) quedan para siempre en HistorialEstados, que no se edita.
    FechaCierre   DATETIME2(3)  NULL,
    MotivoCierre  NVARCHAR(500) NULL,

    CONSTRAINT CK_Expedientes_Solicitante CHECK (LEN(LTRIM(RTRIM(Solicitante))) > 0),
    CONSTRAINT CK_Expedientes_Asunto      CHECK (LEN(LTRIM(RTRIM(Asunto))) > 0),
    CONSTRAINT CK_Expedientes_Responsable CHECK (LEN(LTRIM(RTRIM(Responsable))) > 0),
    CONSTRAINT CK_Expedientes_Categoria   CHECK (Categoria IS NULL OR Categoria IN (N'Civil', N'Familiar', N'Laboral')),
    CONSTRAINT CK_Expedientes_Estado      CHECK (Estado IN (N'Abierto', N'En seguimiento', N'Cerrado')),
    CONSTRAINT CK_Expedientes_Cierre      CHECK (
        (Estado =  N'Cerrado' AND FechaCierre IS NOT NULL AND LEN(LTRIM(RTRIM(MotivoCierre))) > 0)
     OR (Estado <> N'Cerrado' AND FechaCierre IS NULL AND MotivoCierre IS NULL)
    )
);
GO
CREATE UNIQUE INDEX UX_Expedientes_Codigo ON dbo.Expedientes (Codigo);
CREATE INDEX IX_Expedientes_Solicitante ON dbo.Expedientes (Solicitante);
GO

/* Cada actividad es una entrada independiente (no se edita ni elimina). */
CREATE TABLE dbo.Actividades (
    Id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Actividades PRIMARY KEY,
    ExpedienteId  INT           NOT NULL CONSTRAINT FK_Actividades_Expedientes REFERENCES dbo.Expedientes(Id),
    Descripcion   NVARCHAR(1000) NOT NULL,
    Tipo          NVARCHAR(50)  NULL,       -- opcional (Llamada, Reunión, Documento, Audiencia, Otro)
    Fecha         DATETIME2(3)  NOT NULL CONSTRAINT DF_Actividades_Fecha DEFAULT (SYSDATETIME()),
    Orden         BIGINT        NOT NULL CONSTRAINT DF_Actividades_Orden DEFAULT (NEXT VALUE FOR dbo.SeqHistorial),
    CONSTRAINT CK_Actividades_Descripcion CHECK (LEN(LTRIM(RTRIM(Descripcion))) > 0)
);
GO
CREATE INDEX IX_Actividades_Expediente ON dbo.Actividades (ExpedienteId, Orden);
GO

/* Apertura (EstadoAnterior NULL) y cada cambio de estado. */
CREATE TABLE dbo.HistorialEstados (
    Id             INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_HistorialEstados PRIMARY KEY,
    ExpedienteId   INT           NOT NULL CONSTRAINT FK_Historial_Expedientes REFERENCES dbo.Expedientes(Id),
    EstadoAnterior NVARCHAR(20)  NULL,
    EstadoNuevo    NVARCHAR(20)  NOT NULL,
    Motivo         NVARCHAR(500) NULL,
    Fecha          DATETIME2(3)  NOT NULL CONSTRAINT DF_Historial_Fecha DEFAULT (SYSDATETIME()),
    Orden          BIGINT        NOT NULL CONSTRAINT DF_Historial_Orden DEFAULT (NEXT VALUE FOR dbo.SeqHistorial)
);
GO
CREATE INDEX IX_Historial_Expediente ON dbo.HistorialEstados (ExpedienteId, Orden);
GO

/* ============================ VISTAS ============================ */
/* Columnas en camelCase = mismos nombres que el contrato OpenAPI. */
CREATE VIEW dbo.vw_Expedientes AS
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
CREATE VIEW dbo.vw_HistorialExpediente AS
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

/* ===================== PROCEDIMIENTOS (reglas) =====================
   Códigos de error (el backend los traduce a HTTP):
     50400 -> 400 validación     50404 -> 404 no existe
     50409 -> 409 estado no permite la acción
     50422 -> 422 regla de negocio no cumplida
   ================================================================== */
CREATE PROCEDURE dbo.sp_CrearExpediente
    @Solicitante NVARCHAR(150),
    @Asunto      NVARCHAR(500),
    @Responsable NVARCHAR(150),
    @Categoria   NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;

    SET @Solicitante = LTRIM(RTRIM(@Solicitante));
    SET @Asunto      = LTRIM(RTRIM(@Asunto));
    SET @Responsable = LTRIM(RTRIM(@Responsable));
    SET @Categoria   = NULLIF(LTRIM(RTRIM(@Categoria)), N'');

    IF @Solicitante IS NULL OR @Solicitante = N'' THROW 50400, N'El nombre o alias del solicitante es obligatorio.', 1;
    IF @Asunto      IS NULL OR @Asunto      = N'' THROW 50400, N'La descripción del asunto es obligatoria.', 1;
    IF @Responsable IS NULL OR @Responsable = N'' THROW 50400, N'El nombre del responsable es obligatorio.', 1;
    IF @Categoria IS NOT NULL AND @Categoria NOT IN (N'Civil', N'Familiar', N'Laboral')
        THROW 50400, N'La categoría debe ser Civil, Familiar o Laboral.', 1;

    DECLARE @Id INT;
    BEGIN TRY
    BEGIN TRAN;
        INSERT INTO dbo.Expedientes (Solicitante, Asunto, Responsable, Categoria)
        VALUES (@Solicitante, @Asunto, @Responsable, @Categoria);
        SET @Id = SCOPE_IDENTITY();

        INSERT INTO dbo.HistorialEstados (ExpedienteId, EstadoAnterior, EstadoNuevo)
        VALUES (@Id, NULL, N'Abierto');
    COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH;

    SELECT * FROM dbo.vw_Expedientes WHERE id = @Id;
END;
GO

CREATE PROCEDURE dbo.sp_AgregarActividad
    @ExpedienteId INT,
    @Descripcion  NVARCHAR(1000),
    @Tipo         NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;

    SET @Descripcion = LTRIM(RTRIM(@Descripcion));
    SET @Tipo        = NULLIF(LTRIM(RTRIM(@Tipo)), N'');

    BEGIN TRY
    BEGIN TRAN;
        DECLARE @Estado NVARCHAR(20);
        SELECT @Estado = Estado FROM dbo.Expedientes WITH (UPDLOCK, HOLDLOCK) WHERE Id = @ExpedienteId;

        IF @Estado IS NULL      THROW 50404, N'El expediente no existe.', 1;
        IF @Estado = N'Cerrado' THROW 50409, N'El expediente está cerrado y no admite nuevas actividades.', 1;
        IF @Descripcion IS NULL OR @Descripcion = N'' THROW 50400, N'La descripción de la actividad es obligatoria.', 1;

        INSERT INTO dbo.Actividades (ExpedienteId, Descripcion, Tipo)
        VALUES (@ExpedienteId, @Descripcion, @Tipo);
        DECLARE @ActId INT = SCOPE_IDENTITY();
    COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH;

    SELECT Id AS id, ExpedienteId AS expedienteId, Descripcion AS descripcion,
           Tipo AS tipo, Fecha AS fecha, Orden AS orden
    FROM dbo.Actividades WHERE Id = @ActId;
END;
GO

CREATE PROCEDURE dbo.sp_PasarASeguimiento
    @ExpedienteId INT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;

    BEGIN TRY
    BEGIN TRAN;
        DECLARE @Estado NVARCHAR(20);
        SELECT @Estado = Estado FROM dbo.Expedientes WITH (UPDLOCK, HOLDLOCK) WHERE Id = @ExpedienteId;

        IF @Estado IS NULL       THROW 50404, N'El expediente no existe.', 1;
        IF @Estado <> N'Abierto' THROW 50409, N'Solo un expediente en estado Abierto puede pasar a En seguimiento.', 1;

        UPDATE dbo.Expedientes SET Estado = N'En seguimiento' WHERE Id = @ExpedienteId;
        INSERT INTO dbo.HistorialEstados (ExpedienteId, EstadoAnterior, EstadoNuevo)
        VALUES (@ExpedienteId, N'Abierto', N'En seguimiento');
    COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH;

    SELECT * FROM dbo.vw_Expedientes WHERE id = @ExpedienteId;
END;
GO

CREATE PROCEDURE dbo.sp_CerrarExpediente
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
CREATE PROCEDURE dbo.sp_ReabrirExpediente
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

PRINT N'Base de datos BufetePopular inicializada correctamente.';
GO

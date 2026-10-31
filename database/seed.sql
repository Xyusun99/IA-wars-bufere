/* Datos FICTICIOS de demostración (opcional). Ejecutar después de init.sql:
     sqlcmd -S localhost -E -f 65001 -i database/seed.sql
   o: cd backend && npm run db:seed */
USE BufetePopular;
GO
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

EXEC dbo.sp_CrearExpediente N'Persona Demo A', N'Consulta ficticia sobre pensión alimenticia', N'Lic. Responsable Uno', N'Familiar';
EXEC dbo.sp_CrearExpediente N'Alias Demo B',   N'Consulta ficticia sobre despido',            N'Lic. Responsable Dos', N'Laboral';

DECLARE @A INT = (SELECT Id FROM dbo.Expedientes WHERE Solicitante = N'Persona Demo A');
EXEC dbo.sp_AgregarActividad @A, N'Entrevista inicial con la persona solicitante', N'Reunión';
EXEC dbo.sp_PasarASeguimiento @A;
GO
PRINT N'Datos de demostración cargados.';
GO

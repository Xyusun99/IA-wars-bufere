import sql from 'mssql';
import 'dotenv/config';

export function buildConfig(database = process.env.DB_NAME ?? 'BufetePopular'): sql.config {
  const instanceName = process.env.DB_INSTANCE || undefined;
  return {
    server: process.env.DB_SERVER ?? 'localhost',
    port: instanceName ? undefined : Number(process.env.DB_PORT ?? 1433),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
    options: {
      instanceName,
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

let pool: sql.ConnectionPool | null = null;

/** Pool compartido. Usar: const db = await getPool(); db.request()... */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await new sql.ConnectionPool(buildConfig()).connect();
  }
  return pool;
}

export { sql };

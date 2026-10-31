/**
 * Ejecuta un archivo .sql con separadores GO (alternativa a sqlcmd).
 * Uso: npm run db:init   |   npm run db:seed
 * Se conecta a "master" porque init.sql crea la base de datos.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sql from 'mssql';
import { buildConfig } from '../config/db.js';

const file = process.argv[2];
if (!file) {
  console.error('Uso: tsx src/scripts/runSql.ts <archivo.sql>');
  process.exit(1);
}

const batches = readFileSync(resolve(file), 'utf8')
  .split(/^\s*GO\s*$/gim)
  .map((b) => b.trim())
  .filter(Boolean);

// Una sola conexión para que "USE BufetePopular" aplique a los lotes siguientes.
const pool = new sql.ConnectionPool({ ...buildConfig('master'), pool: { max: 1, min: 1 } });

try {
  await pool.connect();
  for (const batch of batches) {
    await pool.request().batch(batch);
  }
  console.log(`OK: ${file} ejecutado (${batches.length} lotes).`);
} catch (err) {
  console.error('Error ejecutando SQL:', (err as Error).message);
  process.exitCode = 1;
} finally {
  await pool.close();
}

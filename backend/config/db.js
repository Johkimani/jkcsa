const { Pool } = require('pg');
require('dotenv').config();

// Prefer a single DATABASE_URL (useful for hosted DBs). If not provided,
// fall back to individual env vars for local development.
const connectionString = process.env.DATABASE_URL || null;

// Decide whether to use SSL.
// For remote/managed DBs (e.g., Aiven, AWS RDS), SSL is typically required.
// Set DB_SSL_REQUIRE='false' to disable (local dev only).
// Default: enable SSL for non-local hosts, disable for localhost.
const isLocalhost = !process.env.DB_HOST || ['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST);
const useSSL = process.env.DB_SSL_REQUIRE === 'false' ? false : !isLocalhost;
// For remote DBs default to allowing self-signed certs to accommodate hosted providers
// that may not present a cert chain Node already trusts (set DB_SSL_REJECT='true' to enforce verification).
const ssl = useSSL ? { rejectUnauthorized: process.env.DB_SSL_REJECT === 'true' } : false;
// const ssl=false;
// If a DATABASE_URL isn't provided, try to build one from individual env vars.
let effectiveConnectionString = connectionString;
if (!effectiveConnectionString && process.env.DB_HOST) {
  const user = encodeURIComponent(process.env.DB_USER || 'postgres');
  const pass = encodeURIComponent(process.env.DB_PASSWORD || '');
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || '5432';
  const db = process.env.DB_NAME || 'officials_db';
  effectiveConnectionString = `postgresql://${user}:${pass}@${host}:${port}/${db}`;
}

const poolConfig = {
  connectionString: effectiveConnectionString || undefined,
  host: effectiveConnectionString ? undefined : (process.env.DB_HOST || 'localhost'),
  port: effectiveConnectionString ? undefined : (process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432),
  database: effectiveConnectionString ? undefined : (process.env.DB_NAME || 'officials_db'),
  user: effectiveConnectionString ? undefined : (process.env.DB_USER || 'postgres'),
  password: effectiveConnectionString ? undefined : (process.env.DB_PASSWORD || ''),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
  ssl,
};

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
module.exports = pool;

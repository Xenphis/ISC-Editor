import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) throw new Error('Not connected to database')
  return pool
}

export async function connect(
  host: string,
  port: number,
  user: string,
  password: string,
  database: string
): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 5000,
    supportBigNumbers: true,
    bigNumberStrings: false,
  })
  // Valider la connexion immédiatement
  const conn = await pool.getConnection()
  conn.release()
}

export async function disconnect(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

export function isConnected(): boolean {
  return pool !== null
}

import 'server-only'
import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise'
import { env } from './env'

// One pool per database. Both use the goomba_web MariaDB user: read access to the game
// database (plus writes to accounts and launch tokens) and full access to the website's own.
const globalPools = globalThis as unknown as { __goombaPools?: { game: Pool; web: Pool } }

function pools(): { game: Pool; web: Pool } {
  if (!globalPools.__goombaPools) {
    const { host, port, user, password, gameDb, webDb } = env.db
    const common = {
      host,
      port,
      user,
      password,
      connectionLimit: 10,
      charset: 'utf8mb4',
      // Blobs (messages, extra data) come back as Buffers; DATETIMEs as JS Dates.
      dateStrings: false,
      supportBigNumbers: true,
      bigNumberStrings: false
    }
    globalPools.__goombaPools = {
      game: mysql.createPool({ ...common, database: gameDb }),
      web: mysql.createPool({ ...common, database: webDb })
    }
  }
  return globalPools.__goombaPools
}

type Params = (string | number | boolean | null | Date | Buffer)[]

export async function gameQuery<T = RowDataPacket>(sql: string, params: Params = []): Promise<T[]> {
  const [rows] = await pools().game.query<RowDataPacket[]>(sql, params)
  return rows as T[]
}

export async function gameOne<T = RowDataPacket>(sql: string, params: Params = []): Promise<T | null> {
  return (await gameQuery<T>(sql, params))[0] ?? null
}

export async function gameExec(sql: string, params: Params = []): Promise<ResultSetHeader> {
  const [res] = await pools().game.execute<ResultSetHeader>(sql, params)
  return res
}

export async function webQuery<T = RowDataPacket>(sql: string, params: Params = []): Promise<T[]> {
  const [rows] = await pools().web.query<RowDataPacket[]>(sql, params)
  return rows as T[]
}

export async function webOne<T = RowDataPacket>(sql: string, params: Params = []): Promise<T | null> {
  return (await webQuery<T>(sql, params))[0] ?? null
}

export async function webExec(sql: string, params: Params = []): Promise<ResultSetHeader> {
  const [res] = await pools().web.execute<ResultSetHeader>(sql, params)
  return res
}

/** Runs fn with a connection to the game database inside a transaction. */
export async function gameTransaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pools().game.getConnection()
  try {
    await conn.beginTransaction()
    const out = await fn(conn)
    await conn.commit()
    return out
  } catch (e) {
    await conn.rollback().catch(() => {})
    throw e
  } finally {
    conn.release()
  }
}

/** Number of characters logged in right now (one row per character in accounts_sessions). */
export async function onlineCount(): Promise<number> {
  try {
    const row = await gameOne<{ n: number }>('SELECT COUNT(*) AS n FROM accounts_sessions')
    return Number(row?.n ?? 0)
  } catch {
    return 0
  }
}

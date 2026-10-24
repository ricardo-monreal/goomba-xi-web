#!/usr/bin/env node
// Applies migrations/*.sql to the website database (WEB_DB_NAME), each once, in name order.
// Uses the same GAME_DB_* login as the site. Run by `goomba web-update` after every build.

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations')
const need = (k) => {
  if (!process.env[k]) throw new Error(`migrate: ${k} is not set`)
  return process.env[k]
}

const conn = await mysql.createConnection({
  host: process.env.GAME_DB_HOST ?? '127.0.0.1',
  port: Number(process.env.GAME_DB_PORT ?? 3306),
  user: need('GAME_DB_USER'),
  password: need('GAME_DB_PASSWORD'),
  database: process.env.WEB_DB_NAME ?? 'goomba_web',
  multipleStatements: true
})

try {
  await conn.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(100) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)'
  )
  const [rows] = await conn.query('SELECT name FROM schema_migrations')
  const done = new Set(rows.map((r) => r.name))
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
  let applied = 0
  for (const f of files) {
    if (done.has(f)) continue
    console.log(`migrate: applying ${f}`)
    await conn.query(readFileSync(join(dir, f), 'utf8'))
    await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [f])
    applied++
  }
  console.log(applied ? `migrate: ${applied} migration(s) applied` : 'migrate: up to date')
} finally {
  await conn.end()
}

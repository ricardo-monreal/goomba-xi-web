#!/usr/bin/env node
// Imports in-game item names, descriptions and icons from item DAT dumps in the YAML format
// written by Kraken (https://github.com/Frankie-hz/Kraken), such as the Phoenix Era-DATs repo.
//
//   node scripts/import-items.mjs --era /path/to/Era-DATs [--yaml more.yml ...] [--icons ./icons-out] [--dry-run]
//
// --era    an Era-DATs checkout; its English item files are read (YAML/ROM/118/*.yml,
//          YAML/ROM/286/73.yml, YAML/ROM/301/115.yml).
// --yaml   extra Kraken item YAML files, e.g. your own dump of ROM/118/106 (general items,
//          which Era-DATs doesn't change and so doesn't include). Later files win.
// --icons  write <id>.png for every item into this folder. Upload the folder to your file
//          server as <FILES_URL>/icons/items/ (see the README).
// Names and descriptions go into the website database's item_text table (WEB_DB_NAME), using
// the same GAME_DB_* login as the site. Items without an entry keep a prettified server name.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { deflateSync, crc32 } from 'node:zlib'
import * as yaml from 'js-yaml'
import mysql from 'mysql2/promise'

const args = process.argv.slice(2)
const opt = { era: '', yaml: [], icons: '', dryRun: false }
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--era') opt.era = args[++i]
  else if (a === '--yaml') opt.yaml.push(args[++i])
  else if (a === '--icons') opt.icons = args[++i]
  else if (a === '--dry-run') opt.dryRun = true
  else {
    console.error(`import-items: unknown option ${a}`)
    process.exit(2)
  }
}

const files = []
if (opt.era) {
  const base = join(opt.era, 'YAML')
  for (const rel of ['ROM/118/106.yml', 'ROM/118/107.yml', 'ROM/118/108.yml', 'ROM/118/109.yml', 'ROM/118/110.yml', 'ROM/286/73.yml', 'ROM/301/115.yml']) {
    const f = join(base, rel)
    if (existsSync(f)) files.push(f)
  }
  if (!files.length) throw new Error(`import-items: no item YAML found under ${base}`)
}
files.push(...opt.yaml)
if (!files.length) {
  console.error('usage: node scripts/import-items.mjs --era <Era-DATs dir> [--yaml file ...] [--icons dir] [--dry-run]')
  process.exit(2)
}

// ---- Icon -> PNG ---------------------------------------------------------------------------

// Icon bytes: 1 byte + 16-byte label ("armor   12552   "), a 40-byte BITMAPINFOHEADER
// (32x32, 8 bits per pixel), a 256-colour BGRA palette (alpha 0x80 = opaque), then 32x32
// palette indices stored bottom-up.
function iconToPng(b64) {
  const buf = Buffer.from(b64 + '='.repeat((4 - (b64.length % 4)) % 4), 'base64')
  const hdr = 17
  if (buf.length < hdr + 40 || buf.readUInt32LE(hdr) !== 40) return null
  const w = buf.readInt32LE(hdr + 4)
  const h = buf.readInt32LE(hdr + 8)
  const bpp = buf.readUInt16LE(hdr + 14)
  if (w !== 32 || Math.abs(h) !== 32 || bpp !== 8) return null
  const pal = hdr + 40
  const px = pal + 1024
  if (buf.length < px + w * Math.abs(h)) return null
  const rows = Math.abs(h)
  const raw = Buffer.alloc(rows * (1 + w * 4))
  for (let y = 0; y < rows; y++) {
    const srcRow = h > 0 ? rows - 1 - y : y // bottom-up when height is positive
    raw[y * (1 + w * 4)] = 0 // filter: none
    for (let x = 0; x < w; x++) {
      const idx = buf[px + srcRow * w + x]
      const p = pal + idx * 4
      const o = y * (1 + w * 4) + 1 + x * 4
      raw[o] = buf[p + 2]
      raw[o + 1] = buf[p + 1]
      raw[o + 2] = buf[p]
      raw[o + 3] = Math.min(255, buf[p + 3] * 2)
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(td) >>> 0)
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(rows, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

// ---- Read items ----------------------------------------------------------------------------

const items = new Map()
let icons = 0
if (opt.icons && !opt.dryRun) mkdirSync(opt.icons, { recursive: true })
for (const f of files) {
  const doc = yaml.load(readFileSync(f, 'utf8'))
  const list = Array.isArray(doc?.items) ? doc.items : []
  let n = 0
  for (const it of list) {
    const id = Number(it?.id)
    const name = it?.strings?.name
    if (!Number.isInteger(id) || id <= 0 || id >= 65535 || typeof name !== 'string' || !name.trim() || name === '.') continue
    const description = typeof it.strings.description === 'string' ? it.strings.description : ''
    let hasIcon = false
    if (typeof it.icon_bytes === 'string' && it.icon_bytes) {
      const png = iconToPng(it.icon_bytes)
      if (png) {
        hasIcon = true
        if (opt.icons && !opt.dryRun) writeFileSync(join(opt.icons, `${id}.png`), png)
        icons++
      }
    }
    items.set(id, { id, name: name.trim().slice(0, 64), description, hasIcon })
    n++
  }
  console.log(`import-items: ${f}: ${n} items`)
}
console.log(`import-items: ${items.size} items, ${icons} icons${opt.icons && !opt.dryRun ? ` written to ${opt.icons}` : ''}`)
if (opt.dryRun) {
  const sample = [...items.values()].slice(0, 3).map((i) => `${i.id} ${i.name}`)
  console.log('import-items: dry run, nothing written. Sample:', sample.join(' | '))
  process.exit(0)
}

// ---- Write to the database -----------------------------------------------------------------

const need = (k) => {
  if (!process.env[k]) throw new Error(`import-items: ${k} is not set`)
  return process.env[k]
}
const conn = await mysql.createConnection({
  host: process.env.GAME_DB_HOST ?? '127.0.0.1',
  port: Number(process.env.GAME_DB_PORT ?? 3306),
  user: need('GAME_DB_USER'),
  password: need('GAME_DB_PASSWORD'),
  database: process.env.WEB_DB_NAME ?? 'goomba_web',
  charset: 'utf8mb4'
})
try {
  const rows = [...items.values()]
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    await conn.query(
      `INSERT INTO item_text (itemid, name, description, has_icon) VALUES ?
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), has_icon = VALUES(has_icon)`,
      [batch.map((r) => [r.id, r.name, r.description, r.hasIcon ? 1 : 0])]
    )
  }
  console.log(`import-items: saved ${rows.length} items to item_text`)
} finally {
  await conn.end()
}

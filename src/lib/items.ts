import 'server-only'
import mods from '@/data/mods.json'
import { gameOne, gameQuery } from './db'
import { env } from './env'

const WEB = () => `\`${env.db.webDb.replace(/[^A-Za-z0-9_]/g, '')}\``
const MOD_NAMES = mods as Record<string, string>

export async function searchItems(opts: { q?: string; category?: number; page?: number; perPage?: number }) {
  const where: string[] = ['b.itemid > 0', 'b.itemid < 65535']
  const params: (string | number)[] = []
  if (opts.q) {
    const like = `%${opts.q.replace(/[%_\\]/g, '\\$&')}%`
    where.push('(t.name LIKE ? OR b.name LIKE ?)')
    params.push(like, like.replace(/ /g, '\\_'))
  }
  if (opts.category) {
    where.push('b.aH = ?')
    params.push(opts.category)
  }
  const perPage = opts.perPage ?? 50
  const page = Math.max(1, opts.page ?? 1)
  const from = `FROM item_basic b LEFT JOIN ${WEB()}.item_text t ON t.itemid = b.itemid LEFT JOIN item_equipment e ON e.itemId = b.itemid`
  const total = await gameOne<{ n: number }>(`SELECT COUNT(*) AS n ${from} WHERE ${where.join(' AND ')}`, params)
  const rows = await gameQuery<{ itemid: number; level: number | null; slot: number | null; aH: number }>(
    `SELECT b.itemid, e.level, e.slot, b.aH ${from} WHERE ${where.join(' AND ')}
      ORDER BY COALESCE(t.name, b.name) LIMIT ? OFFSET ?`,
    [...params, perPage, (page - 1) * perPage]
  )
  return { total: Number(total?.n ?? 0), page, perPage, rows }
}

export interface ItemDetail {
  equipment: { level: number; jobs: number; slot: number; shieldSize: number } | null
  weapon: { skill: number; dmg: number; delay: number } | null
  mods: { name: string; value: number; id: number }[]
  ah: {
    onSale: number
    onSaleStacks: number
    recent: { stack: number; sale: number; sell_date: number; seller_name: string; buyer_name: string }[]
  }
  bazaarSellers: number
}

const SKILLS: Record<number, string> = {
  1: 'Hand-to-Hand', 2: 'Dagger', 3: 'Sword', 4: 'Great Sword', 5: 'Axe', 6: 'Great Axe', 7: 'Scythe', 8: 'Polearm',
  9: 'Katana', 10: 'Great Katana', 11: 'Club', 12: 'Staff', 25: 'Archery', 26: 'Marksmanship', 27: 'Throwing',
  41: 'Stringed Instrument', 42: 'Wind Instrument'
}
export const skillName = (id: number): string => SKILLS[id] ?? ''

export async function itemDetail(id: number): Promise<ItemDetail | null> {
  const exists = await gameOne('SELECT itemid FROM item_basic WHERE itemid = ?', [id])
  if (!exists) return null
  const [equip, weapon, modRows, onSale, recent, bazaar] = await Promise.all([
    gameOne<{ level: number; jobs: number; slot: number; shieldSize: number }>('SELECT level, jobs, slot, shieldSize FROM item_equipment WHERE itemId = ?', [id]),
    gameOne<{ skill: number; dmg: number; delay: number }>('SELECT skill, dmg, delay FROM item_weapon WHERE itemId = ?', [id]),
    gameQuery<{ modId: number; value: number }>('SELECT modId, value FROM item_mods WHERE itemId = ? ORDER BY modId', [id]),
    gameOne<{ single: number; stacks: number }>('SELECT SUM(stack = 0) AS single, SUM(stack = 1) AS stacks FROM auction_house WHERE itemid = ? AND sale = 0', [id]),
    gameQuery<{ stack: number; sale: number; sell_date: number; seller_name: string; buyer_name: string }>(
      'SELECT stack, sale, sell_date, seller_name, buyer_name FROM auction_house WHERE itemid = ? AND sale > 0 ORDER BY sell_date DESC LIMIT 20',
      [id]
    ),
    gameOne<{ n: number }>('SELECT COUNT(DISTINCT charid) AS n FROM char_inventory WHERE itemId = ? AND location = 0 AND bazaar > 0', [id])
  ])
  return {
    equipment: equip,
    weapon,
    mods: modRows.map((m) => ({ id: m.modId, value: m.value, name: MOD_NAMES[String(m.modId)] ?? `Mod ${m.modId}` })),
    ah: { onSale: Number(onSale?.single ?? 0), onSaleStacks: Number(onSale?.stacks ?? 0), recent },
    bazaarSellers: Number(bazaar?.n ?? 0)
  }
}

/** Item modifiers for many items at once (dressing room totals). */
export async function itemMods(ids: number[]): Promise<Map<number, { name: string; value: number; id: number }[]>> {
  const unique = [...new Set(ids.filter((i) => Number.isInteger(i) && i > 0))]
  const out = new Map<number, { name: string; value: number; id: number }[]>()
  if (!unique.length) return out
  const rows = await gameQuery<{ itemId: number; modId: number; value: number }>(
    `SELECT itemId, modId, value FROM item_mods WHERE itemId IN (${unique.map(() => '?').join(',')})`,
    unique
  )
  for (const r of rows) {
    const list = out.get(r.itemId) ?? []
    list.push({ id: r.modId, value: r.value, name: MOD_NAMES[String(r.modId)] ?? `Mod ${r.modId}` })
    out.set(r.itemId, list)
  }
  return out
}

/** Gear a job can wear in a slot up to a level, for the dressing room picker. */
export async function equippable(opts: { slotBit: number; job: number; level: number; q: string }) {
  const params: (string | number)[] = [opts.slotBit, 1 << (opts.job - 1), opts.level]
  let filter = ''
  if (opts.q) {
    const like = `%${opts.q.replace(/[%_\\]/g, '\\$&')}%`
    filter = 'AND (t.name LIKE ? OR b.name LIKE ?)'
    params.push(like, like.replace(/ /g, '\\_'))
  }
  return gameQuery<{ itemid: number; level: number }>(
    `SELECT e.itemId AS itemid, e.level FROM item_equipment e
       JOIN item_basic b ON b.itemid = e.itemId
       LEFT JOIN ${WEB()}.item_text t ON t.itemid = e.itemId
      WHERE (e.slot & ?) <> 0 AND (e.jobs & ?) <> 0 AND e.level <= ? ${filter}
      ORDER BY e.level DESC, COALESCE(t.name, b.name) LIMIT 40`,
    params
  )
}

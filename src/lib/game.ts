import 'server-only'
import { gameOne, gameQuery, webQuery } from './db'
import { env } from './env'
import { prettyItemName } from './ffxi'

// The website database name, for joins with xidb (both live on the same MariaDB server).
const WEB = (): string => {
  const name = env.db.webDb
  if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error('WEB_DB_NAME may only contain letters, digits and _')
  return `\`${name}\``
}

export const GIL_ITEM = 65535
export const LINKSHELL_ITEMS = { LINKSHELL: 513, PEARLSACK: 514, LINKPEARL: 515 }

// ---- Items --------------------------------------------------------------------------------

export interface ItemInfo {
  id: number
  name: string
  description: string
  hasIcon: boolean
  stackSize: number
  flags: number
  ah: number
}

/** Display names, descriptions and basics for a set of item ids. */
export async function itemInfo(ids: number[]): Promise<Map<number, ItemInfo>> {
  const unique = [...new Set(ids.filter((i) => Number.isInteger(i) && i > 0 && i < GIL_ITEM))]
  const out = new Map<number, ItemInfo>()
  if (!unique.length) return out
  const rows = await gameQuery<{ itemid: number; name: string; stackSize: number; flags: number; aH: number; tname: string | null; tdesc: string | null; has_icon: number | null }>(
    `SELECT b.itemid, b.name, b.stackSize, b.flags, b.aH, t.name AS tname, t.description AS tdesc, t.has_icon
       FROM item_basic b LEFT JOIN ${WEB()}.item_text t ON t.itemid = b.itemid
      WHERE b.itemid IN (${unique.map(() => '?').join(',')})`,
    unique
  )
  for (const r of rows) {
    out.set(r.itemid, {
      id: r.itemid,
      name: r.tname ?? prettyItemName(r.name),
      description: r.tdesc ?? '',
      hasIcon: !!r.has_icon,
      stackSize: r.stackSize,
      flags: r.flags,
      ah: r.aH
    })
  }
  return out
}

/** Folder of item icons on the file server (made by scripts/import-items.mjs --icons). */
export const iconBase = (): string => (env.filesUrl ? `${env.filesUrl}/icons/items` : '')

// ---- Characters ---------------------------------------------------------------------------

export interface CharacterRow {
  charid: number
  accid: number
  name: string
  nation: number
  race: number
  mjob: number
  mlvl: number
  sjob: number
  slvl: number
  online: boolean
  anon: boolean
  zone: string
}

const CHAR_COLUMNS = `
  c.charid, c.accid, c.charname AS name, c.nation, l.race, s.mjob, s.mlvl, s.sjob, s.slvl,
  (sess.charid IS NOT NULL AND COALESCE(p.hide_online, 0) = 0) AS online,
  COALESCE(p.hide_jobs, 0) AS anon,
  z.name AS zone`

const CHAR_FROM = () => `
  FROM chars c
  JOIN char_stats s ON s.charid = c.charid
  JOIN char_look l ON l.charid = c.charid
  LEFT JOIN accounts_sessions sess ON sess.charid = c.charid
  LEFT JOIN zone_settings z ON z.zoneid = c.pos_zone
  LEFT JOIN ${WEB()}.char_privacy p ON p.charid = c.charid`

type RawChar = Omit<CharacterRow, 'online' | 'anon'> & { online: number; anon: number }
const toChar = (r: RawChar): CharacterRow => ({ ...r, online: !!r.online, anon: !!r.anon })

export async function searchCharacters(opts: { q?: string; nation?: number; online?: boolean; page?: number; perPage?: number }) {
  const where = ['c.accid > 0', 'c.gmlevel = 0', 'COALESCE(p.hide_profile, 0) = 0']
  const params: (string | number)[] = []
  if (opts.q) {
    where.push('c.charname LIKE ?')
    params.push(`${opts.q.replace(/[%_\\]/g, '\\$&')}%`)
  }
  if (opts.nation !== undefined && opts.nation >= 0 && opts.nation <= 2) {
    where.push('c.nation = ?')
    params.push(opts.nation)
  }
  if (opts.online) where.push('sess.charid IS NOT NULL AND COALESCE(p.hide_online, 0) = 0')
  const perPage = opts.perPage ?? 20
  const page = Math.max(1, opts.page ?? 1)
  const total = await gameOne<{ n: number }>(`SELECT COUNT(*) AS n ${CHAR_FROM()} WHERE ${where.join(' AND ')}`, params)
  const rows = await gameQuery<RawChar>(
    `SELECT ${CHAR_COLUMNS} ${CHAR_FROM()} WHERE ${where.join(' AND ')} ORDER BY c.charname LIMIT ? OFFSET ?`,
    [...params, perPage, (page - 1) * perPage]
  )
  return { total: Number(total?.n ?? 0), page, perPage, rows: rows.map(toChar) }
}

export async function charactersForAccount(accid: number): Promise<(CharacterRow & { rank: number })[]> {
  const rows = await gameQuery<RawChar & { rank: number }>(
    `SELECT ${CHAR_COLUMNS},
            CASE c.nation WHEN 0 THEN pr.rank_sandoria WHEN 1 THEN pr.rank_bastok ELSE pr.rank_windurst END AS \`rank\`
       ${CHAR_FROM()}
       LEFT JOIN char_profile pr ON pr.charid = c.charid
      WHERE c.accid = ?
      ORDER BY c.charname`,
    [accid]
  )
  return rows.map((r) => ({ ...toChar(r), rank: Number(r.rank ?? 1) }))
}

export interface CharacterDetail extends CharacterRow {
  title: number
  playtime: number
  created: Date
  gil: number
  rank: number
  hideProfile: boolean
  hideOnline: boolean
  jobs: Record<string, number>
  exp: Record<string, number>
  genkai: number
  profile: { fame_sandoria: number; fame_bastok: number; fame_windurst: number; fame_norg: number; rank_sandoria: number; rank_bastok: number; rank_windurst: number }
  equipment: Record<number, number>
  crafts: Record<number, number>
  maatsCap: number
  missions: { name: string; completed: number }[]
}

// chars.missions is an array of missionlog_t (src/common/mmo.h): uint16 current, statusUpper,
// statusLower, then bool complete[64] = 70 bytes per log, in xi.mission.area order.
const MISSION_LOG_SIZE = 70
const MISSION_LOGS: [number, string][] = [
  [0, "San d'Oria"], [1, 'Bastok'], [2, 'Windurst'], [3, 'Rise of the Zilart'], [4, 'Treasures of Aht Urhgan']
]
function decodeMissions(blob: Buffer | null): { name: string; completed: number }[] {
  return MISSION_LOGS.map(([log, name]) => {
    let completed = 0
    if (blob) {
      const start = log * MISSION_LOG_SIZE + 6
      for (let i = 0; i < 64 && start + i < blob.length; i++) if (blob[start + i]) completed++
    }
    return { name, completed }
  })
}

const JOB_COLS = ['war', 'mnk', 'whm', 'blm', 'rdm', 'thf', 'pld', 'drk', 'bst', 'brd', 'rng', 'sam', 'nin', 'drg', 'smn', 'blu', 'cor', 'pup']

export async function getCharacter(name: string): Promise<CharacterDetail | null> {
  if (!/^[A-Za-z]{1,15}$/.test(name)) return null
  const base = await gameOne<RawChar & { title: number; playtime: number; timecreated: Date; hide_profile: number; hide_online: number; missions: Buffer | null }>(
    `SELECT ${CHAR_COLUMNS}, s.title, c.playtime, c.timecreated, c.missions,
            COALESCE(p.hide_profile, 0) AS hide_profile, COALESCE(p.hide_online, 0) AS hide_online
       ${CHAR_FROM()}
      WHERE c.charname = ? AND c.accid > 0`,
    [name]
  )
  if (!base) return null
  const id = base.charid
  const [jobs, exp, profile, equip, skills, gil, maat] = await Promise.all([
    gameOne<Record<string, number>>(`SELECT genkai, ${JOB_COLS.join(', ')} FROM char_jobs WHERE charid = ?`, [id]),
    gameOne<Record<string, number>>(`SELECT ${JOB_COLS.join(', ')} FROM char_exp WHERE charid = ?`, [id]),
    gameOne<CharacterDetail['profile']>(
      'SELECT fame_sandoria, fame_bastok, fame_windurst, fame_norg, rank_sandoria, rank_bastok, rank_windurst FROM char_profile WHERE charid = ?',
      [id]
    ),
    gameQuery<{ equipslotid: number; itemId: number }>(
      `SELECT e.equipslotid, i.itemId FROM char_equip e
         JOIN char_inventory i ON i.charid = e.charid AND i.location = e.containerid AND i.slot = e.slotid
        WHERE e.charid = ? AND i.itemId <> ?`,
      // New characters get a placeholder char_equip row pointing at inventory slot 0, which holds gil.
      [id, GIL_ITEM]
    ),
    gameQuery<{ skillid: number; value: number }>('SELECT skillid, value FROM char_skills WHERE charid = ? AND skillid BETWEEN 48 AND 59', [id]),
    gameOne<{ quantity: number }>('SELECT quantity FROM char_inventory WHERE charid = ? AND location = 0 AND slot = 0 AND itemId = ?', [id, GIL_ITEM]),
    gameOne<{ value: number }>("SELECT value FROM char_vars WHERE charid = ? AND varname = 'maatsCap'", [id])
  ])
  const p = profile ?? { fame_sandoria: 0, fame_bastok: 0, fame_windurst: 0, fame_norg: 0, rank_sandoria: 1, rank_bastok: 1, rank_windurst: 1 }
  const { missions: _missionBlob, ...baseRow } = base
  return {
    ...toChar(baseRow as RawChar),
    title: base.title,
    playtime: base.playtime,
    created: base.timecreated,
    gil: Number(gil?.quantity ?? 0),
    rank: [p.rank_sandoria, p.rank_bastok, p.rank_windurst][base.nation] ?? 1,
    hideProfile: !!base.hide_profile,
    hideOnline: !!base.hide_online,
    jobs: Object.fromEntries(JOB_COLS.map((j) => [j.toUpperCase(), Number(jobs?.[j] ?? 0)])),
    exp: Object.fromEntries(JOB_COLS.map((j) => [j.toUpperCase(), Number(exp?.[j] ?? 0)])),
    genkai: Number(jobs?.genkai ?? 50),
    profile: p,
    equipment: Object.fromEntries(equip.map((e) => [e.equipslotid, e.itemId])),
    crafts: Object.fromEntries(skills.map((s) => [s.skillid, s.value])),
    maatsCap: Number(maat?.value ?? 0),
    missions: decodeMissions(base.missions)
  }
}

export interface InventoryItem {
  location: number
  slot: number
  itemId: number
  quantity: number
  bazaar: number
}

export async function characterInventory(charid: number): Promise<InventoryItem[]> {
  return gameQuery<InventoryItem>(
    'SELECT location, slot, itemId, quantity, bazaar FROM char_inventory WHERE charid = ? AND itemId <> ? ORDER BY location, slot',
    [charid, GIL_ITEM]
  )
}

export async function characterAuctions(charid: number) {
  const [listed, sold, bought] = await Promise.all([
    gameQuery<{ id: number; itemid: number; stack: number; price: number; date: number }>(
      'SELECT id, itemid, stack, price, date FROM auction_house WHERE seller = ? AND sale = 0 ORDER BY date DESC',
      [charid]
    ),
    gameQuery<{ id: number; itemid: number; stack: number; sale: number; buyer_name: string; sell_date: number }>(
      'SELECT id, itemid, stack, sale, buyer_name, sell_date FROM auction_house WHERE seller = ? AND sale > 0 ORDER BY sell_date DESC LIMIT 50',
      [charid]
    ),
    gameQuery<{ id: number; itemid: number; stack: number; sale: number; seller_name: string; sell_date: number }>(
      'SELECT id, itemid, stack, sale, seller_name, sell_date FROM auction_house WHERE buyer = ? ORDER BY sell_date DESC LIMIT 50',
      [charid]
    )
  ])
  return { listed, sold, bought }
}

export async function characterDelivery(charid: number) {
  return gameQuery<{ box: number; slot: number; itemid: number; quantity: number; sender: string | null; charname: string | null; received: number; sent: number }>(
    'SELECT box, slot, itemid, quantity, sender, charname, received, sent FROM delivery_box WHERE charid = ? ORDER BY box, slot',
    [charid]
  )
}

export async function characterBazaar(charid: number) {
  return gameQuery<{ itemId: number; quantity: number; bazaar: number }>(
    'SELECT itemId, quantity, bazaar FROM char_inventory WHERE charid = ? AND location = 0 AND bazaar > 0 ORDER BY bazaar DESC',
    [charid]
  )
}

/** Characters on this account, for ownership checks. */
export async function ownsCharacter(accid: number, charid: number): Promise<boolean> {
  return !!(await gameOne('SELECT charid FROM chars WHERE charid = ? AND accid = ?', [charid, accid]))
}

export async function privacyFor(charid: number) {
  const rows = await webQuery<{ hide_profile: number; hide_jobs: number; hide_online: number }>(
    'SELECT hide_profile, hide_jobs, hide_online FROM char_privacy WHERE charid = ?',
    [charid]
  )
  const r = rows[0]
  return { hideProfile: !!r?.hide_profile, hideJobs: !!r?.hide_jobs, hideOnline: !!r?.hide_online }
}

// ---- Linkshells ---------------------------------------------------------------------------

// Linkshell id = first 4 bytes (little-endian) of the item's extra data (Exdata::Linkshell.GroupId).
const LS_ID_SQL = `(ORD(SUBSTRING(i.extra, 1, 1)) + ORD(SUBSTRING(i.extra, 2, 1)) * 256 +
  ORD(SUBSTRING(i.extra, 3, 1)) * 65536 + ORD(SUBSTRING(i.extra, 4, 1)) * 16777216)`

export interface LinkshellRow {
  id: number
  name: string
  color: number
  members: number
  online: number
  leader: string | null
  description: string
  tags: string[]
  recruiting: boolean
}

export async function listLinkshells(q?: string): Promise<LinkshellRow[]> {
  const params: string[] = []
  let where = 'ls.broken = 0'
  if (q) {
    where += ' AND ls.name LIKE ?'
    params.push(`%${q.replace(/[%_\\]/g, '\\$&')}%`)
  }
  const rows = await gameQuery<{ id: number; name: string; color: number; members: number; online: number; leader: string | null; description: string | null; tags: string | null; recruiting: number | null }>(
    `SELECT ls.linkshellid AS id, ls.name, ls.color,
            COALESCE(m.members, 0) AS members,
            (SELECT COUNT(*) FROM accounts_sessions s WHERE s.linkshellid1 = ls.linkshellid OR s.linkshellid2 = ls.linkshellid) AS online,
            m.leader, lp.description, lp.tags, lp.recruiting
       FROM linkshells ls
       LEFT JOIN (
         SELECT ${LS_ID_SQL} AS lsid,
                COUNT(DISTINCT i.charid) AS members,
                MAX(CASE WHEN i.itemId = ${LINKSHELL_ITEMS.LINKSHELL} THEN c.charname END) AS leader
           FROM char_inventory i JOIN chars c ON c.charid = i.charid AND c.accid > 0
          WHERE i.itemId IN (${LINKSHELL_ITEMS.LINKSHELL}, ${LINKSHELL_ITEMS.PEARLSACK}, ${LINKSHELL_ITEMS.LINKPEARL})
          GROUP BY lsid
       ) m ON m.lsid = ls.linkshellid
       LEFT JOIN ${WEB()}.linkshell_profiles lp ON lp.linkshellid = ls.linkshellid
      WHERE ${where}
      HAVING members > 0
      ORDER BY online DESC, ls.name`,
    params
  )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    members: Number(r.members),
    online: Number(r.online),
    leader: r.leader,
    description: r.description ?? '',
    tags: (r.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
    recruiting: !!r.recruiting
  }))
}

export async function linkshellMembers(lsid: number) {
  return gameQuery<{ name: string; itemId: number; mjob: number; mlvl: number; online: number; anon: number }>(
    `SELECT c.charname AS name, MIN(i.itemId) AS itemId, s.mjob, s.mlvl,
            MAX(sess.charid IS NOT NULL AND COALESCE(p.hide_online, 0) = 0) AS online,
            MAX(COALESCE(p.hide_jobs, 0)) AS anon
       FROM char_inventory i
       JOIN chars c ON c.charid = i.charid AND c.accid > 0
       JOIN char_stats s ON s.charid = c.charid
       LEFT JOIN accounts_sessions sess ON sess.charid = c.charid
       LEFT JOIN ${WEB()}.char_privacy p ON p.charid = c.charid
      WHERE i.itemId IN (${LINKSHELL_ITEMS.LINKSHELL}, ${LINKSHELL_ITEMS.PEARLSACK}, ${LINKSHELL_ITEMS.LINKPEARL})
        AND ${LS_ID_SQL} = ? AND COALESCE(p.hide_profile, 0) = 0
      GROUP BY c.charid
      ORDER BY MIN(i.itemId), c.charname`,
    [lsid]
  )
}

/** Is this account the holder of the linkshell (owns the linkshell item itself)? */
export async function isLinkshellHolder(accid: number, lsid: number): Promise<boolean> {
  const r = await gameOne(
    `SELECT 1 FROM char_inventory i JOIN chars c ON c.charid = i.charid
      WHERE c.accid = ? AND i.itemId = ${LINKSHELL_ITEMS.LINKSHELL} AND ${LS_ID_SQL} = ? LIMIT 1`,
    [accid, lsid]
  )
  return !!r
}

// ---- Bazaar -------------------------------------------------------------------------------

export async function bazaarSummary(q?: string) {
  const params: (string | number)[] = []
  let filter = ''
  if (q) {
    filter = `AND (b.name LIKE ? OR t.name LIKE ?)`
    const like = `%${q.replace(/[%_\\]/g, '\\$&').replace(/ /g, '_')}%`
    params.push(like, `%${q.replace(/[%_\\]/g, '\\$&')}%`)
  }
  return gameQuery<{ itemId: number; listings: number; sellers: number; minPrice: number; onlineSellers: number }>(
    `SELECT i.itemId, COUNT(*) AS listings, COUNT(DISTINCT i.charid) AS sellers, MIN(i.bazaar) AS minPrice,
            COUNT(DISTINCT CASE WHEN sess.charid IS NOT NULL THEN i.charid END) AS onlineSellers
       FROM char_inventory i
       JOIN chars c ON c.charid = i.charid AND c.accid > 0
       JOIN item_basic b ON b.itemid = i.itemId
       LEFT JOIN ${WEB()}.item_text t ON t.itemid = i.itemId
       LEFT JOIN accounts_sessions sess ON sess.charid = i.charid
      WHERE i.location = 0 AND i.bazaar > 0 ${filter}
      GROUP BY i.itemId
      ORDER BY listings DESC, i.itemId
      LIMIT 200`,
    params
  )
}

export async function bazaarSellers(itemId: number) {
  return gameQuery<{ name: string; price: number; quantity: number; online: number; zone: string | null }>(
    `SELECT c.charname AS name, i.bazaar AS price, i.quantity,
            (sess.charid IS NOT NULL AND COALESCE(p.hide_online, 0) = 0) AS online, z.name AS zone
       FROM char_inventory i
       JOIN chars c ON c.charid = i.charid AND c.accid > 0
       LEFT JOIN accounts_sessions sess ON sess.charid = i.charid
       LEFT JOIN zone_settings z ON z.zoneid = c.pos_zone
       LEFT JOIN ${WEB()}.char_privacy p ON p.charid = c.charid
      WHERE i.location = 0 AND i.bazaar > 0 AND i.itemId = ?
      ORDER BY online DESC, i.bazaar ASC`,
    [itemId]
  )
}

// ---- Yells --------------------------------------------------------------------------------

export async function recentYells(sinceHours = 24, limit = 300) {
  return gameQuery<{ lineID: number; speaker: string; type: string; zoneid: number | null; message: Buffer | string; datetime: Date; zone: string | null }>(
    `SELECT a.lineID, a.speaker, a.type, a.zoneid, a.message, a.datetime, z.name AS zone
       FROM audit_chat a LEFT JOIN zone_settings z ON z.zoneid = a.zoneid
      WHERE a.type IN ('YELL', 'SHOUT') AND a.datetime > NOW() - INTERVAL ? HOUR
      ORDER BY a.datetime DESC, a.lineID DESC LIMIT ?`,
    [sinceHours, limit]
  )
}

// ---- World info ---------------------------------------------------------------------------

export const CONQUEST_REGIONS = [
  'Ronfaure', 'Zulkheim', 'Norvallen', 'Gustaberg', 'Derfland', 'Sarutabaruta', 'Kolshushu', 'Aragoneu', 'Fauregandi',
  'Valdeaunia', 'Qufim', "Li'Telor", 'Kuzotz', 'Vollbow', 'Elshimo Lowlands', 'Elshimo Uplands', "Tu'Lia", 'Movalpolos',
  'Tavnazian Archipelago'
]
export const CONQUEST_OWNERS = ["San d'Oria", 'Bastok', 'Windurst', 'Beastmen']

export async function conquest() {
  return gameQuery<{ region_id: number; region_control: number; sandoria_influence: number; bastok_influence: number; windurst_influence: number }>(
    'SELECT region_id, region_control, sandoria_influence, bastok_influence, windurst_influence FROM conquest_system ORDER BY region_id'
  ).catch(() => [])
}

export async function guildPointsToday() {
  const v = await gameOne<{ value: number }>("SELECT value FROM server_variables WHERE name = '[GUILD]pattern'").catch(() => null)
  const pattern = Number(v?.value ?? 0)
  const rows = await gameQuery<{ guildid: number; itemid: number; rank: number; points: number; max_points: number }>(
    'SELECT guildid, itemid, `rank`, points, max_points FROM guild_item_points WHERE pattern = ? ORDER BY guildid, `rank`',
    [pattern]
  ).catch(() => [])
  return { pattern, rows }
}

export async function weatherZones() {
  return gameQuery<{ zoneid: number; name: string; weather: Buffer }>(
    `SELECT z.zoneid, z.name, w.weather FROM zone_weather w JOIN zone_settings z ON z.zoneid = w.zone
      WHERE w.weather IS NOT NULL AND w.weather <> REPEAT(CHAR(0), LENGTH(w.weather)) ORDER BY z.name`
  ).catch(() => [])
}

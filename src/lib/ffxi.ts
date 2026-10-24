// FINAL FANTASY XI constants shared by pages and API routes (no database access here).

import experience from '@/data/experience.json'

export const JOBS = [
  'WAR', 'MNK', 'WHM', 'BLM', 'RDM', 'THF', 'PLD', 'DRK', 'BST', 'BRD', 'RNG', 'SAM',
  'NIN', 'DRG', 'SMN', 'BLU', 'COR', 'PUP', 'DNC', 'SCH', 'GEO', 'RUN'
] as const
export type JobAbbr = (typeof JOBS)[number]

/** The 18 jobs that exist in the Goomba XI era (through Treasures of Aht Urhgan). */
export const ERA_JOBS = JOBS.slice(0, 18)

/** char_stats.mjob / sjob are 1-based. */
export const jobName = (id: number): string => (id >= 1 && id <= JOBS.length ? JOBS[id - 1] : '')

export const JOB_NAMES: Record<string, string> = {
  WAR: 'Warrior', MNK: 'Monk', WHM: 'White Mage', BLM: 'Black Mage', RDM: 'Red Mage', THF: 'Thief',
  PLD: 'Paladin', DRK: 'Dark Knight', BST: 'Beastmaster', BRD: 'Bard', RNG: 'Ranger', SAM: 'Samurai',
  NIN: 'Ninja', DRG: 'Dragoon', SMN: 'Summoner', BLU: 'Blue Mage', COR: 'Corsair', PUP: 'Puppetmaster',
  DNC: 'Dancer', SCH: 'Scholar', GEO: 'Geomancer', RUN: 'Rune Fencer'
}

export const RACES: Record<number, { race: string; gender: string }> = {
  1: { race: 'Hume', gender: 'Male' },
  2: { race: 'Hume', gender: 'Female' },
  3: { race: 'Elvaan', gender: 'Male' },
  4: { race: 'Elvaan', gender: 'Female' },
  5: { race: 'Tarutaru', gender: 'Male' },
  6: { race: 'Tarutaru', gender: 'Female' },
  7: { race: 'Mithra', gender: '' },
  8: { race: 'Galka', gender: '' }
}
export const raceLabel = (id: number): string => {
  const r = RACES[id]
  return r ? [r.race, r.gender].filter(Boolean).join(' ') : 'Unknown'
}

export const NATIONS = ["San d'Oria", 'Bastok', 'Windurst'] as const
export const nationName = (id: number): string => NATIONS[id] ?? ''
export const NATION_KEYS = ['sandoria', 'bastok', 'windurst'] as const

/** char_equip.equipslotid -> label, in the order the equipment grid shows them. */
export const EQUIP_GRID: { slot: number; label: string }[] = [
  { slot: 0, label: 'Main' }, { slot: 1, label: 'Sub' }, { slot: 2, label: 'Ranged' }, { slot: 3, label: 'Ammo' },
  { slot: 4, label: 'Head' }, { slot: 9, label: 'Neck' }, { slot: 11, label: 'Ear 1' }, { slot: 12, label: 'Ear 2' },
  { slot: 5, label: 'Body' }, { slot: 6, label: 'Hands' }, { slot: 13, label: 'Ring 1' }, { slot: 14, label: 'Ring 2' },
  { slot: 15, label: 'Back' }, { slot: 10, label: 'Waist' }, { slot: 7, label: 'Legs' }, { slot: 8, label: 'Feet' }
]

/** item_equipment.slot is a bit mask of these (1 << equipslotid). */
export const SLOT_BITS: { bit: number; label: string; slot: number }[] = EQUIP_GRID.map((s) => ({
  bit: 1 << s.slot,
  label: s.label.replace(/ \d$/, ''),
  slot: s.slot
}))
export const slotLabels = (mask: number): string[] => {
  const labels: string[] = []
  for (const s of SLOT_BITS) if (mask & s.bit && !labels.includes(s.label)) labels.push(s.label)
  return labels
}

/** item_equipment.jobs is a bit mask, bit (job id - 1). */
export const jobsFromMask = (mask: number): string[] => {
  if ((mask & 0x3ffff) === 0x3ffff) return ['All jobs']
  return JOBS.filter((_, i) => mask & (1 << i))
}

/** char_inventory.location values. */
export const CONTAINERS: { id: number; name: string }[] = [
  { id: 0, name: 'Inventory' },
  { id: 1, name: 'Mog Safe' },
  { id: 2, name: 'Storage' },
  { id: 4, name: 'Mog Locker' },
  { id: 5, name: 'Mog Satchel' },
  { id: 6, name: 'Mog Sack' },
  { id: 7, name: 'Mog Case' },
  { id: 8, name: 'Mog Wardrobe' }
]

/** char_skills.skillid for crafts; value is stored as skill * 10. */
export const CRAFTS: { id: number; name: string }[] = [
  { id: 48, name: 'Fishing' }, { id: 49, name: 'Woodworking' }, { id: 50, name: 'Smithing' },
  { id: 51, name: 'Goldsmithing' }, { id: 52, name: 'Clothcraft' }, { id: 53, name: 'Leathercraft' },
  { id: 54, name: 'Bonecraft' }, { id: 55, name: 'Alchemy' }, { id: 56, name: 'Cooking' }, { id: 59, name: 'Digging' }
]

export const GUILDS = ['Fishing', 'Woodworking', 'Smithing', 'Goldsmithing', 'Clothcraft', 'Leathercraft', 'Bonecraft', 'Alchemy', 'Cooking']
/** guild_item_points.rank 0..7 (guild point turn-ins start at Novice). */
export const GUILD_POINT_RANKS = ['Novice', 'Apprentice', 'Journeyman', 'Craftsman', 'Artisan', 'Adept', 'Veteran', 'Expert']

/** Fame points -> level (scripts/data/fame.lua). */
const FAME_THRESHOLDS = [0, 50, 125, 225, 325, 425, 488, 550, 613]
export function fameLevel(points: number): { level: number; progress: number } {
  let level = 1
  FAME_THRESHOLDS.forEach((p, i) => {
    if (points >= p) level = i + 1
  })
  const lo = FAME_THRESHOLDS[level - 1]
  const hi = FAME_THRESHOLDS[level]
  const progress = hi === undefined ? 1 : (points - lo) / (hi - lo)
  return { level, progress: Math.max(0, Math.min(1, progress)) }
}

/** Fame areas shown on character pages, from char_profile (Jeuno is derived like the server does). */
export function fameAreas(p: { fame_sandoria: number; fame_bastok: number; fame_windurst: number; fame_norg: number }) {
  return [
    { key: 'sandoria', name: "San d'Oria", points: p.fame_sandoria },
    { key: 'bastok', name: 'Bastok', points: p.fame_bastok },
    { key: 'windurst', name: 'Windurst', points: p.fame_windurst },
    { key: 'norg', name: 'Norg', points: p.fame_norg },
    { key: 'jeuno', name: 'Jeuno', points: Math.floor((p.fame_sandoria + p.fame_bastok + p.fame_windurst) / 2) }
  ].map((a) => ({ ...a, ...fameLevel(a.points) }))
}

/** Exp needed to go from level n to n + 1. */
const NEXT = experience as Record<string, number>
export const expToNext = (level: number): number => NEXT[String(level)] ?? 0
/** Total exp to reach a level from level 1. */
export function expForLevel(level: number): number {
  let total = 0
  for (let l = 1; l < level; l++) total += expToNext(l)
  return total
}
export const MAAT_CAP = 75

// ---- Zones ----------------------------------------------------------------------------------

// zone_settings.name matches the scripts/zones folder, e.g. "Northern_San_dOria", "RuLude_Gardens".
const ZONE_FIXES: [RegExp, string][] = [
  [/_dO/g, " d'O"], // San_dOria, Chateau_dOraguille
  [/RuLude/g, "Ru'Lude"],
  [/FeiYin/g, "Fei'Yin"],
  [/ZiTah/g, "Zi'Tah"],
  [/RoMaeve/g, "Ro'Maeve"],
  [/HuXzoi/g, "Hu'Xzoi"],
  [/RuHmet/g, "Ru'Hmet"],
  [/AlTaieu/g, "Al'Taieu"],
  [/RuAun/g, "Ru'Aun"],
  [/VeLugannon/g, "Ve'Lugannon"],
  [/RuAvitau/g, "Ru'Avitau"],
  [/QuBia/g, "Qu'Bia"],
  [/LaLoff/g, "La'Loff"],
  [/PsoXja/g, "Pso'Xja"],
  [/RaKaznar/g, "Ra'Kaznar"],
  [/King_Ranperres/g, "King Ranperre's"],
  [/Ordelles/g, "Ordelle's"],
  [/Carpenters_/g, "Carpenters' "],
  [/Crawlers_/g, "Crawlers' "],
  [/Behemoths/g, "Behemoth's"],
  [/Dragons_/g, "Dragon's "],
  [/Ifrits/g, "Ifrit's"],
  [/Delkfutts/g, "Delkfutt's"],
  [/Ghoyus/g, "Ghoyu's"],
  [/Sealions/g, "Sealion's"],
  [/-/g, ' - ']
]
export function zoneDisplayName(raw: string | null | undefined): string {
  if (!raw) return ''
  let s = raw
  for (const [re, rep] of ZONE_FIXES) s = s.replace(re, rep)
  return s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}

// ---- Items ----------------------------------------------------------------------------------

/** Fallback when no display name was imported: "onion_sword" -> "Onion Sword". */
export function prettyItemName(raw: string): string {
  return raw
    .split('_')
    .map((w) =>
      /^(of|in|the|a)$/.test(w) ? w : /^(ii|iii|iv|vi|vii|viii|ix|x)$/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(' ')
}

export const ITEM_FLAGS = { EX: 0x4000, RARE: 0x8000, NOAUCTION: 0x40, NOSALE: 0x1000, NODELIVERY: 0x2000 }

/** item_basic.aH auction house category. */
export const AH_CATEGORIES: Record<number, string> = {
  1: 'Hand-to-Hand', 2: 'Dagger', 3: 'Sword', 4: 'Great Sword', 5: 'Axe', 6: 'Great Axe', 7: 'Scythe', 8: 'Polearm',
  9: 'Katana', 10: 'Great Katana', 11: 'Club', 12: 'Staff', 13: 'Ranged', 14: 'Instruments', 15: 'Ammunition',
  16: 'Shields', 17: 'Head', 18: 'Body', 19: 'Hands', 20: 'Legs', 21: 'Feet', 22: 'Neck', 23: 'Waist', 24: 'Earrings',
  25: 'Rings', 26: 'Back', 28: 'White Magic', 29: 'Black Magic', 30: 'Summoning', 31: 'Ninjutsu', 32: 'Songs',
  33: 'Medicines', 34: 'Furnishings', 35: 'Crystals', 36: 'Cards', 37: 'Cursed Items', 38: 'Smithing', 39: 'Goldsmithing',
  40: 'Clothcraft', 41: 'Leathercraft', 42: 'Bonecraft', 43: 'Woodworking', 44: 'Alchemy', 46: 'Misc.',
  47: 'Fishing Gear', 48: 'Pet Items', 49: 'Ninja Tools', 50: 'Beast-made', 51: 'Fish', 52: 'Meat & Eggs',
  53: 'Seafood', 54: 'Vegetables', 55: 'Soups', 56: 'Breads & Rice', 57: 'Sweets', 58: 'Drinks', 59: 'Ingredients',
  60: 'Dice', 61: 'Automaton', 62: 'Grips', 63: 'Alchemy 2', 64: 'Misc. 2', 65: 'Misc. 3'
}

export const AH_GROUPS: { name: string; ids: number[] }[] = [
  { name: 'Weapons', ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 47, 48, 62] },
  { name: 'Armor', ids: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26] },
  { name: 'Scrolls', ids: [28, 29, 30, 31, 32, 60] },
  { name: 'Medicines', ids: [33] },
  { name: 'Furnishings', ids: [34] },
  { name: 'Materials', ids: [35, 38, 39, 40, 41, 42, 43, 44, 63] },
  { name: 'Food', ids: [51, 52, 53, 54, 55, 56, 57, 58, 59] },
  { name: 'Others', ids: [36, 37, 46, 49, 50, 61, 64, 65] }
]

/** Linkshell colour: 16-bit 0xABGR-ish (4 bits per channel, the in-game palette). */
export function linkshellColor(color: number): string {
  const r = (color & 0x0f) * 17
  const g = ((color >> 4) & 0x0f) * 17
  const b = ((color >> 8) & 0x0f) * 17
  return `rgb(${r}, ${g}, ${b})`
}

export function formatPlaytime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export const formatGil = (n: number): string => n.toLocaleString('en-US')

/**
 * Mods the server stores in hundredths of a percent (400 = 4%): gear, magic and ability haste.
 */
const BASIS_POINT_MODS = new Set([167, 217, 383, 384])

/** "+5", "-3", or "+4%" for haste-style mods. */
export function formatModValue(id: number, value: number): string {
  const sign = value > 0 ? '+' : ''
  if (BASIS_POINT_MODS.has(id)) return `${sign}${Number((value / 100).toFixed(2))}%`
  return `${sign}${value}`
}

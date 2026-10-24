#!/usr/bin/env node
// Generates the website's static lookup tables in src/data/*.json.
//
//   node scripts/gen-data.mjs                 approved addons list only
//   LSB_DIR=/opt/goomba/server node scripts/gen-data.mjs
//                                             also experience table, item stat names and
//                                             ferry/airship schedules from the LandSandBoat
//                                             server's data/*.yaml (`goomba web-update` sets it)
//
// The generated JSON is committed, so a build without LSB_DIR keeps the last version.
// PHOENIX_DIR is still accepted for servers on the Phoenix fork.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'src', 'data')
const write = (name, value) => {
  writeFileSync(join(dataDir, name), JSON.stringify(value, null, 1) + '\n')
  console.log(`gen-data: wrote src/data/${name}`)
}

// ---- Approved addons -------------------------------------------------------------------------

const PROGRAMS = { A: 'Ashita', W: 'Windower', S: 'Standalone' }
const addons = readFileSync(join(dataDir, 'approved-addons.txt'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((line, i) => {
    const [name, codes = '', condition = ''] = line.split('|').map((s) => s.trim())
    const programs = [...codes].map((c) => {
      if (!PROGRAMS[c]) throw new Error(`approved-addons.txt line ${i + 1}: unknown program "${c}"`)
      return PROGRAMS[c]
    })
    return condition ? { name, programs, condition } : { name, programs }
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
write('approved-addons.json', addons)

// ---- LandSandBoat server data ----------------------------------------------------------------

const server = process.env.LSB_DIR || process.env.PHOENIX_DIR
if (!server) {
  console.log('gen-data: LSB_DIR not set; keeping the committed experience.json, mods.json and transport.json')
  process.exit(0)
}
const loadYaml = (rel) => yaml.load(readFileSync(join(server, 'data', rel), 'utf8'))
if (!existsSync(join(server, 'data', 'experience.yaml'))) {
  throw new Error(`LSB_DIR=${server} doesn't look like a LandSandBoat checkout`)
}

// Exp needed to go from level N to N+1.
const exp = loadYaml('experience.yaml').experience.next_level
write('experience.json', Object.fromEntries(Object.entries(exp).map(([k, v]) => [Number(k), Number(v)])))

// Item modifier id -> label, for item stats. Labels follow the in-game item text where
// it has a short form (STR, DEF, Accuracy...); anything else is the enum name, spaced out.
const SHORT = {
  def: 'DEF', hp: 'HP', hpp: 'HP%', mp: 'MP', mpp: 'MP%', str: 'STR', dex: 'DEX', vit: 'VIT', agi: 'AGI',
  int: 'INT', mnd: 'MND', chr: 'CHR', attp: 'Attack%', defp: 'DEF%', rattp: 'Ranged Attack%',
  att: 'Attack', ratt: 'Ranged Attack', acc: 'Accuracy', racc: 'Ranged Accuracy', eva: 'Evasion',
  macc: 'Magic Accuracy', matt: 'Magic Attack', mdef: 'Magic Defense', meva: 'Magic Evasion',
  haste_gear: 'Haste', haste_magic: 'Magic Haste', regen: 'Regen', refresh: 'Refresh', regain: 'Regain',
  enmity: 'Enmity', store_tp: 'Store TP', dual_wield: 'Dual Wield', double_attack: 'Double Attack',
  triple_attack: 'Triple Attack', crithitrate: 'Critical Hit Rate', fastcast: 'Fast Cast',
  cure_potency: 'Cure Potency', conserve_mp: 'Conserve MP', subtle_blow: 'Subtle Blow',
  fire_res: 'Fire Resistance', ice_res: 'Ice Resistance', wind_res: 'Wind Resistance',
  earth_res: 'Earth Resistance', thunder_res: 'Lightning Resistance', water_res: 'Water Resistance',
  light_res: 'Light Resistance', dark_res: 'Dark Resistance', move_speed_gear_bonus: 'Movement Speed',
  movement_speed: 'Movement Speed', treasure_hunter: 'Treasure Hunter', spell_interruption_rate: 'Spell Interruption Rate',
  dmg: 'Damage Taken', dmgphys: 'Physical Damage Taken', dmgmagic: 'Magic Damage Taken', dmgbreath: 'Breath Damage Taken',
  hprecoverrest: 'HP Recovered While Healing', mprecoverrest: 'MP Recovered While Healing'
}
const ACRONYMS = new Set(['hp', 'mp', 'tp', 'ws', 'str', 'dex', 'vit', 'agi', 'int', 'mnd', 'chr', 'def', 'pet', 'mab', 'mdb'])
const label = (key) =>
  SHORT[key] ??
  key
    .split('_')
    .map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
const mods = {}
for (const [key, id] of Object.entries(loadYaml('enums/mod.yaml').values)) {
  if (typeof id === 'number' && id !== 0) mods[id] = label(key)
}
write('mods.json', mods)

// Ferries and airships. Each run cycles every `every` seconds (Earth seconds since the
// Vana'diel epoch, shifted by `offset`), starting with its arriving phase; it leaves when the
// departing phase begins (src/map/transports/ship_handler.cpp).
const PLACE = {
  sandoria: "San d'Oria", bastok: 'Bastok', windurst: 'Windurst', jeuno: 'Jeuno', kazham: 'Kazham',
  selbina: 'Selbina', mhaura: 'Mhaura', whitegate: 'Al Zahbi', nashmau: 'Nashmau', bibiki: 'Bibiki Bay',
  manaclip: 'Bibiki Bay', purgonorgo: 'Purgonorgo Isle', tours: 'Bibiki Bay (tour)', norg: 'Norg'
}
const transports = []
for (const zone of readdirSync(join(server, 'data', 'zones'))) {
  const file = join(server, 'data', 'zones', zone, 'zone.yaml')
  if (!existsSync(file)) continue
  const runs = yaml.load(readFileSync(file, 'utf8'))?.transport?.runs
  if (!runs) continue
  for (const [run, def] of Object.entries(runs)) {
    if (!def?.every || !Array.isArray(def.phases)) continue
    let t = 0
    let departAt = null
    let dockedAt = null
    for (const phase of def.phases) {
      if (phase.state === 'docked' && dockedAt === null) dockedAt = t
      if (phase.state === 'departing' && departAt === null) departAt = t
      t += Number(phase.seconds ?? 0)
    }
    if (departAt === null) continue
    let parts = run.split('_')
    let kind = parts.at(-1) === 'airship' ? 'airship' : 'ship'
    let names = PLACE
    if (parts[0] === 'barge') {
      kind = 'barge'
      names = { north: 'North Landing', central: 'Central Landing', south: 'South Landing' }
      parts = parts.slice(1)
    } else if (parts[0] === 'manaclip') {
      kind = 'manaclipper'
      names = { bibiki: 'Bibiki Bay', purgonorgo: 'Purgonorgo Isle', tours: 'Bibiki Bay (tour)' }
      parts = parts.slice(1)
    }
    const from = names[parts[0]] ?? parts[0]
    const to = names[parts[1]] ?? parts[1]
    const note = parts.includes('day') ? 'day' : parts.includes('night') ? 'night' : undefined
    transports.push({ id: run, zone, kind, from, to, ...(note ? { note } : {}), every: def.every, offset: def.offset ?? 0, dockedAt: dockedAt ?? 0, departAt })
  }
}
transports.sort((a, b) => a.kind.localeCompare(b.kind) || a.from.localeCompare(b.from) || a.to.localeCompare(b.to))
write('transport.json', transports)

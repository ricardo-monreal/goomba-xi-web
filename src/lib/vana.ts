// Vana'diel time, matching LandSandBoat's clock (src/common/vana_time.h):
// 25 Vana'diel seconds pass per Earth second, counted from the Vana'diel epoch
// (Earth time 1009810800 = 2001-12-31 15:00 UTC), which is 886/01/01 00:00.

export const VANA_EPOCH_SEC = 1009810800
const VANA_MIN_PER_EARTH_SEC = 25 / 60
const YEAR_DAYS = 360
const MONTH_DAYS = 30
const WEEK_DAYS = 8
const BASE_YEAR = 886

export const WEEKDAYS = [
  { name: 'Firesday', element: 'Fire', color: '#e5533c' },
  { name: 'Earthsday', element: 'Earth', color: '#c9a227' },
  { name: 'Watersday', element: 'Water', color: '#3e8ef0' },
  { name: 'Windsday', element: 'Wind', color: '#3fbf6f' },
  { name: 'Iceday', element: 'Ice', color: '#7fd3f0' },
  { name: 'Lightningday', element: 'Lightning', color: '#b26cf0' },
  { name: 'Lightsday', element: 'Light', color: '#f2efe2' },
  { name: 'Darksday', element: 'Dark', color: '#8a7fa6' }
] as const

export interface VanaTime {
  year: number
  month: number // 1-12
  day: number // 1-30
  weekday: number // 0 Firesday .. 7 Darksday
  hour: number
  minute: number
  /** Whole Vana'diel days since the epoch (no 886-year offset), as the weather table uses. */
  daysSinceEpoch: number
}

/** Earth seconds since the Vana'diel epoch (earth_time::vanadiel_timestamp). */
export const vanaTimestamp = (earthMs: number = Date.now()): number => Math.floor(earthMs / 1000) - VANA_EPOCH_SEC

export function vanaTime(earthMs: number = Date.now()): VanaTime {
  const totalMin = Math.floor((earthMs / 1000 - VANA_EPOCH_SEC) * VANA_MIN_PER_EARTH_SEC)
  const days = Math.floor(totalMin / 1440)
  return {
    year: BASE_YEAR + Math.floor(days / YEAR_DAYS),
    month: Math.floor((days % YEAR_DAYS) / MONTH_DAYS) + 1,
    day: (days % MONTH_DAYS) + 1,
    weekday: days % WEEK_DAYS,
    hour: Math.floor((totalMin % 1440) / 60),
    minute: totalMin % 60,
    daysSinceEpoch: days
  }
}

/** Earth milliseconds at the start of a given Vana'diel day (days since epoch). */
export const earthMsForVanaDay = (days: number): number => (days * 1440) / VANA_MIN_PER_EARTH_SEC * 1000 + VANA_EPOCH_SEC * 1000

/** One Vana'diel day lasts 57.6 Earth minutes. */
export const EARTH_MS_PER_VANA_DAY = 57.6 * 60 * 1000

export interface MoonInfo {
  percent: number
  waxing: boolean
  name: string
}

/** Moon phase (vana_time.h moon::get_phase), on an 84-day cycle. */
export function moon(earthMs: number = Date.now()): MoonInfo {
  const days = vanaTime(earthMs).daysSinceEpoch + YEAR_DAYS * BASE_YEAR
  const mod = (days + 26) % 84
  const waxing = mod >= 42
  const percent = waxing ? Math.round(100 * ((mod - 42) / 42)) : Math.round(100 * (1 - mod / 42))
  return { percent, waxing, name: moonName(percent, waxing) }
}

function moonName(p: number, waxing: boolean): string {
  if (p <= 5) return 'New Moon'
  if (p >= 90) return 'Full Moon'
  if (waxing) return p < 40 ? 'Waxing Crescent' : p < 60 ? 'First Quarter' : 'Waxing Gibbous'
  return p < 40 ? 'Waning Crescent' : p < 60 ? 'Last Quarter' : 'Waning Gibbous'
}

export const pad2 = (n: number): string => String(n).padStart(2, '0')
export const formatVanaClock = (t: VanaTime): string => `${pad2(t.hour)}:${pad2(t.minute)}`
export const formatVanaDate = (t: VanaTime): string => `${t.year}/${pad2(t.month)}/${pad2(t.day)}`

// ---- Weather (zone_weather) --------------------------------------------------------------

export const WEATHER_CYCLE_DAYS = 2160

export const WEATHER: { name: string; element: string }[] = [
  { name: 'Clear', element: '' }, { name: 'Sunshine', element: '' }, { name: 'Clouds', element: '' },
  { name: 'Fog', element: '' }, { name: 'Hot Spell', element: 'Fire' }, { name: 'Heat Wave', element: 'Fire' },
  { name: 'Rain', element: 'Water' }, { name: 'Squall', element: 'Water' }, { name: 'Dust Storm', element: 'Earth' },
  { name: 'Sand Storm', element: 'Earth' }, { name: 'Wind', element: 'Wind' }, { name: 'Gales', element: 'Wind' },
  { name: 'Snow', element: 'Ice' }, { name: 'Blizzards', element: 'Ice' }, { name: 'Thunder', element: 'Lightning' },
  { name: 'Thunderstorms', element: 'Lightning' }, { name: 'Auroras', element: 'Light' },
  { name: 'Stellar Glare', element: 'Light' }, { name: 'Gloom', element: 'Dark' }, { name: 'Darkness', element: 'Dark' }
]

export interface DayWeather {
  normal: number
  common: number
  rare: number
}

/** Decodes one day of a zone_weather blob: 2160 little-endian uint16s, 5 bits each. */
export function weatherForDay(blob: Uint8Array, daysSinceEpoch: number): DayWeather | null {
  const i = (daysSinceEpoch % WEATHER_CYCLE_DAYS) * 2
  if (i + 1 >= blob.length) return null
  const v = blob[i] | (blob[i + 1] << 8)
  if (!v) return null
  return { normal: v >> 10, common: (v >> 5) & 0x1f, rare: v & 0x1f }
}

// ---- Transports ----------------------------------------------------------------------------

export interface Transport {
  id: string
  zone: string
  kind: string
  from: string
  to: string
  note?: string
  every: number
  offset: number
  dockedAt: number
  departAt: number
}

/** Earth ms until the next departure and next arrival of a scheduled run. */
export function nextTransport(t: Transport, earthMs: number = Date.now()) {
  const now = vanaTimestamp(earthMs)
  const into = (((now - t.offset) % t.every) + t.every) % t.every
  const untilDepart = (t.departAt - into + t.every) % t.every
  const untilArrive = (t.dockedAt - into + t.every) % t.every
  const docked = into >= t.dockedAt && into < t.departAt
  return { departInMs: untilDepart * 1000, arriveInMs: untilArrive * 1000, docked }
}

export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}h ${pad2(m)}m` : `${m}m ${pad2(sec)}s`
}

import { itemMods } from '@/lib/items'
import { json } from '@/lib/http'

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get('ids') ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0 && n < 65535)
    .slice(0, 16)
  const mods = await itemMods(ids)
  const totals = new Map<number, { name: string; value: number }>()
  // Count each slot's item, so two of the same ring add up.
  for (const id of ids) {
    for (const m of mods.get(id) ?? []) {
      const t = totals.get(m.id) ?? { name: m.name, value: 0 }
      t.value += m.value
      totals.set(m.id, t)
    }
  }
  return json({ ok: true, totals: [...totals.entries()].sort((a, b) => a[0] - b[0]).map(([id, t]) => ({ id, ...t })).filter((t) => t.value !== 0) })
}

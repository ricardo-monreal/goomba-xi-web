import { iconBase, itemInfo } from '@/lib/game'
import { equippable } from '@/lib/items'
import { json } from '@/lib/http'

export async function GET(req: Request) {
  const u = new URL(req.url)
  const slot = Number(u.searchParams.get('slot'))
  const job = Number(u.searchParams.get('job'))
  const level = Math.min(99, Math.max(1, Number(u.searchParams.get('level')) || 75))
  const q = (u.searchParams.get('q') ?? '').slice(0, 40)
  if (!(slot >= 0 && slot <= 15) || !(job >= 1 && job <= 22)) return json({ ok: true, items: [] })
  const rows = await equippable({ slotBit: 1 << slot, job, level, q })
  const info = await itemInfo(rows.map((r) => r.itemid))
  const icons = iconBase()
  return json({
    ok: true,
    items: rows.map((r) => ({ id: r.itemid, level: r.level, name: info.get(r.itemid)?.name ?? `#${r.itemid}`, icon: info.get(r.itemid)?.hasIcon && icons ? `${icons}/${r.itemid}.png` : '' }))
  })
}

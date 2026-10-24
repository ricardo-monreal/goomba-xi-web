import { iconBase, itemInfo } from '@/lib/game'
import { json } from '@/lib/http'

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get('ids') ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0 && n < 65535)
    .slice(0, 50)
  const info = await itemInfo(ids)
  const icons = iconBase()
  return json({
    ok: true,
    items: Object.fromEntries([...info.values()].map((i) => [i.id, { name: i.name, icon: i.hasIcon && icons ? `${icons}/${i.id}.png` : '' }]))
  })
}

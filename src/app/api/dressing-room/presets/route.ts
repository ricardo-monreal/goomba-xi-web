import { currentAccount } from '@/lib/auth'
import { webExec, webQuery } from '@/lib/db'
import { ownsCharacter } from '@/lib/game'
import { fail, json, readJson, sameOriginJson, str } from '@/lib/http'

export async function GET() {
  const account = await currentAccount()
  if (!account) return json({ ok: true, presets: [] })
  const rows = await webQuery<{ id: number; charid: number; name: string; job: number; items: string | Record<string, number> }>(
    'SELECT id, charid, name, job, items FROM dressing_presets WHERE accid = ? ORDER BY created_at DESC LIMIT 100',
    [account.id]
  )
  return json({ ok: true, presets: rows.map((r) => ({ ...r, items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items })) })
}

export async function POST(req: Request) {
  if (!sameOriginJson(req)) return fail('Bad request.')
  const account = await currentAccount()
  if (!account) return fail('Log in to save presets.', 401)
  const b = await readJson(req)
  const charid = Number(b?.charid)
  if (!(await ownsCharacter(account.id, charid))) return fail('Pick one of your characters.', 403)
  const name = str(b?.name, 40).trim() || 'Preset'
  const job = Math.max(0, Math.min(22, Number(b?.job) || 0))
  const raw = (b?.items ?? {}) as Record<string, unknown>
  const items: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw)) {
    const slot = Number(k)
    const id = Number(v)
    if (slot >= 0 && slot <= 15 && Number.isInteger(id) && id > 0 && id < 65535) items[String(slot)] = id
  }
  const count = await webQuery<{ n: number }>('SELECT COUNT(*) AS n FROM dressing_presets WHERE accid = ?', [account.id])
  if (Number(count[0]?.n ?? 0) >= 100) return fail('You have 100 presets; delete some first.')
  await webExec('INSERT INTO dressing_presets (accid, charid, name, job, items) VALUES (?, ?, ?, ?, ?)', [account.id, charid, name, job, JSON.stringify(items)])
  return json({ ok: true })
}

export async function DELETE(req: Request) {
  const account = await currentAccount()
  if (!account) return fail('Please log in again.', 401)
  const id = Number(new URL(req.url).searchParams.get('id'))
  await webExec('DELETE FROM dressing_presets WHERE id = ? AND accid = ?', [id, account.id])
  return json({ ok: true })
}

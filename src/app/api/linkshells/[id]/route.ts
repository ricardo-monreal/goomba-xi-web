import { currentAccount } from '@/lib/auth'
import { webExec } from '@/lib/db'
import { isLinkshellHolder } from '@/lib/game'
import { fail, json, readJson, sameOriginJson, str } from '@/lib/http'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOriginJson(req)) return fail('Bad request.')
  const account = await currentAccount()
  if (!account) return fail('Please log in again.', 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id) || !(await isLinkshellHolder(account.id, id))) return fail('Only the linkshell holder can edit this page.', 403)
  const b = await readJson(req)
  const tags = str(b?.tags, 200)
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8)
    .join(', ')
  await webExec(
    `INSERT INTO linkshell_profiles (linkshellid, description, tags, recruiting, updated_by) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE description = VALUES(description), tags = VALUES(tags), recruiting = VALUES(recruiting), updated_by = VALUES(updated_by)`,
    [id, str(b?.description, 600).trim(), tags, b?.recruiting === true ? 1 : 0, account.id]
  )
  return json({ ok: true })
}

import { currentAccount } from '@/lib/auth'
import { gameOne, webExec } from '@/lib/db'
import { fail, json, readJson, sameOriginJson } from '@/lib/http'

export async function POST(req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!sameOriginJson(req)) return fail('Bad request.')
  const account = await currentAccount()
  if (!account) return fail('Please log in again.', 401)
  const name = decodeURIComponent((await params).name)
  const c = await gameOne<{ charid: number }>('SELECT charid FROM chars WHERE charname = ? AND accid = ?', [name, account.id])
  if (!c) return fail('That isn’t your character.', 403)
  const b = await readJson(req)
  const flag = (k: string) => (b?.[k] === true ? 1 : 0)
  await webExec(
    `INSERT INTO char_privacy (charid, hide_profile, hide_jobs, hide_online) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE hide_profile = VALUES(hide_profile), hide_jobs = VALUES(hide_jobs), hide_online = VALUES(hide_online)`,
    [c.charid, flag('hideProfile'), flag('hideJobs'), flag('hideOnline')]
  )
  return json({ ok: true })
}

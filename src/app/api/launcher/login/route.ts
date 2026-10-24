// Launcher sign-in. Returns a long-lived launcher session token the launcher keeps in the
// OS keychain; the password itself is never stored by the launcher.
import { clientIp, createSession, verifyCredentials } from '@/lib/auth'
import { fail, json, readJson, str } from '@/lib/http'

export async function POST(req: Request) {
  const body = await readJson(req)
  const login = str(body?.username, 16).trim()
  const password = str(body?.password, 64)
  const device = str(body?.device, 120)
  const ip = await clientIp()
  const r = await verifyCredentials(login, password, ip)
  if (!r.ok) return fail(r.error, 401)
  const token = await createSession(r.account.id, 'launcher', ip, `launcher ${device}`.trim())
  return json({ ok: true, token, account: { id: r.account.id, login: r.account.login } })
}

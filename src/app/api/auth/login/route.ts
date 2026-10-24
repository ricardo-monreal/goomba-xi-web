import { clientIp, createSession, setSessionCookie, verifyCredentials } from '@/lib/auth'
import { fail, json, readJson, sameOriginJson, str } from '@/lib/http'

export async function POST(req: Request) {
  if (!sameOriginJson(req)) return fail('Bad request.', 400)
  const body = await readJson(req)
  const login = str(body?.username, 16).trim()
  const password = str(body?.password, 64)
  const ip = await clientIp()
  const r = await verifyCredentials(login, password, ip)
  if (!r.ok) return fail(r.error, 401)
  const token = await createSession(r.account.id, 'web', ip, req.headers.get('user-agent') ?? '')
  await setSessionCookie(token)
  return json({ ok: true })
}

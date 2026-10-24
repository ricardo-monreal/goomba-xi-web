import { clientIp, createSession, registerAccount, setSessionCookie } from '@/lib/auth'
import { fail, json, readJson, sameOriginJson, str } from '@/lib/http'

export async function POST(req: Request) {
  if (!sameOriginJson(req)) return fail('Bad request.', 400)
  const body = await readJson(req)
  if (body?.agree !== true) return fail('Please read and accept the rules first.')
  const password = str(body?.password, 64)
  if (password !== str(body?.confirm, 64)) return fail('The two passwords don’t match.')
  const ip = await clientIp()
  const r = await registerAccount(str(body?.username, 16).trim(), password, str(body?.email, 64).trim(), ip)
  if (!r.ok) return fail(r.error)
  const token = await createSession(r.id, 'web', ip, req.headers.get('user-agent') ?? '')
  await setSessionCookie(token)
  return json({ ok: true })
}

import { clientIp, createSession, currentAccount, setPassword, setSessionCookie, validatePassword, verifyCredentials } from '@/lib/auth'
import { fail, json, readJson, sameOriginJson, str } from '@/lib/http'

export async function POST(req: Request) {
  if (!sameOriginJson(req)) return fail('Bad request.', 400)
  const account = await currentAccount()
  if (!account) return fail('Please log in again.', 401)
  const body = await readJson(req)
  const current = str(body?.current, 64)
  const next = str(body?.password, 64)
  if (next !== str(body?.confirm, 64)) return fail('The two new passwords don’t match.')
  const problem = validatePassword(next)
  if (problem) return fail(problem)
  const ip = await clientIp()
  const check = await verifyCredentials(account.login, current, ip)
  if (!check.ok) return fail('Your current password is wrong.', 401)
  await setPassword(account.id, next)
  // setPassword signs out every device; sign this browser back in.
  await setSessionCookie(await createSession(account.id, 'web', ip, req.headers.get('user-agent') ?? ''))
  return json({ ok: true })
}

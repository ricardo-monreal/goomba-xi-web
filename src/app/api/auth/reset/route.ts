import { consumePasswordReset } from '@/lib/auth'
import { fail, json, readJson, sameOriginJson, str } from '@/lib/http'

export async function POST(req: Request) {
  if (!sameOriginJson(req)) return fail('Bad request.', 400)
  const body = await readJson(req)
  const password = str(body?.password, 64)
  if (password !== str(body?.confirm, 64)) return fail('The two passwords don’t match.')
  const r = await consumePasswordReset(str(body?.token, 64), password)
  return r.ok ? json({ ok: true }) : fail(r.error ?? 'Could not reset the password.')
}

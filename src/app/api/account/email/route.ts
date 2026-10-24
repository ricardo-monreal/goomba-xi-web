import { clientIp, currentAccount, setEmail, validateEmail, verifyCredentials } from '@/lib/auth'
import { gameOne } from '@/lib/db'
import { fail, json, readJson, sameOriginJson, str } from '@/lib/http'

export async function POST(req: Request) {
  if (!sameOriginJson(req)) return fail('Bad request.', 400)
  const account = await currentAccount()
  if (!account) return fail('Please log in again.', 401)
  const body = await readJson(req)
  const email = str(body?.email, 64).trim()
  const problem = validateEmail(email)
  if (problem) return fail(problem)
  const check = await verifyCredentials(account.login, str(body?.password, 64), await clientIp())
  if (!check.ok) return fail('Your password is wrong.', 401)
  const taken = await gameOne('SELECT id FROM accounts WHERE current_email = ? AND id <> ?', [email, account.id])
  if (taken) return fail('Another account already uses that e-mail address.')
  await setEmail(account.id, email)
  return json({ ok: true })
}

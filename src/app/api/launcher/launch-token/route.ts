// Mints a single-use launch token. The launcher writes it into xiloader's --json file
// as "login_token"; the login server accepts it in place of the password once, within minutes.
import { accountForToken, bearerToken, mintLaunchToken } from '@/lib/auth'
import { fail, json } from '@/lib/http'

export async function POST(req: Request) {
  const account = await accountForToken(bearerToken(req), 'launcher')
  if (!account) return fail('Your launcher session has ended. Sign in again.', 401)
  const { token, expiresInSeconds } = await mintLaunchToken(account.id)
  return json({ ok: true, username: account.login, loginToken: token, expiresInSeconds })
}

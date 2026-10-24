import { createPasswordReset } from '@/lib/auth'
import { env } from '@/lib/env'
import { fail, json, readJson, sameOriginJson, str } from '@/lib/http'
import { sendMail } from '@/lib/mail'

export async function POST(req: Request) {
  if (!sameOriginJson(req)) return fail('Bad request.', 400)
  const body = await readJson(req)
  const email = str(body?.email, 64).trim()
  const reset = await createPasswordReset(email)
  if (reset) {
    const link = `${env.siteUrl}/reset-password?token=${reset.token}`
    await sendMail(
      email,
      'Goomba XI password reset',
      `Hello ${reset.login},\n\nSomeone (hopefully you) asked to reset the password of your Goomba XI account.\n` +
        `Open this link within an hour to choose a new one:\n\n${link}\n\nIf it wasn't you, ignore this e-mail; your password stays the same.\n`
    )
  }
  // Same answer either way, so this can't be used to find out which addresses have accounts.
  return json({ ok: true })
}

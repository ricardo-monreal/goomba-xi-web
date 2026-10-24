import { bearerToken, destroySession } from '@/lib/auth'
import { json } from '@/lib/http'

export async function POST(req: Request) {
  await destroySession(bearerToken(req))
  return json({ ok: true })
}

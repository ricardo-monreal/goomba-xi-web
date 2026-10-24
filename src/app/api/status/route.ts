// Public server status (players online), used by the launcher before sign-in.
import { onlineCount } from '@/lib/db'
import { json } from '@/lib/http'

export async function GET() {
  return json({ ok: true, name: 'Goomba XI', online: await onlineCount() })
}

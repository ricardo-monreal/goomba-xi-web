import { chatText } from '@/lib/chat'
import { zoneDisplayName } from '@/lib/ffxi'
import { recentYells } from '@/lib/game'
import { json } from '@/lib/http'

export async function GET() {
  const rows = await recentYells(24, 300)
  return json({
    ok: true,
    yells: rows.map((r) => ({
      id: r.lineID,
      who: r.speaker,
      type: r.type,
      zone: zoneDisplayName(r.zone),
      text: chatText(r.message),
      at: new Date(r.datetime).toISOString()
    }))
  })
}

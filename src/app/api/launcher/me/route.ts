// Account, characters and server status for the launcher's home screen.
import { accountForToken, bearerToken } from '@/lib/auth'
import { onlineCount } from '@/lib/db'
import { jobName, nationName, raceLabel, zoneDisplayName } from '@/lib/ffxi'
import { charactersForAccount } from '@/lib/game'
import { fail, json } from '@/lib/http'

export async function GET(req: Request) {
  const account = await accountForToken(bearerToken(req), 'launcher')
  if (!account) return fail('Your launcher session has ended. Sign in again.', 401)
  const [chars, online] = await Promise.all([charactersForAccount(account.id), onlineCount()])
  return json({
    ok: true,
    account: { id: account.id, login: account.login },
    online,
    characters: chars.map((c) => ({
      name: c.name,
      race: raceLabel(c.race),
      nation: nationName(c.nation),
      rank: c.rank,
      job: jobName(c.mjob),
      level: c.mlvl,
      subJob: c.sjob ? jobName(c.sjob) : '',
      subLevel: c.slvl,
      zone: zoneDisplayName(c.zone),
      online: c.online
    }))
  })
}

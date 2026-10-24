import { currentAccount } from '@/lib/auth'
import { EQUIP_GRID } from '@/lib/ffxi'
import { charactersForAccount, getCharacter, iconBase, itemInfo } from '@/lib/game'
import DressingRoom from './DressingRoom'

export const metadata = { title: 'Dressing Room' }

export default async function DressingRoomPage() {
  const account = await currentAccount()
  const chars = account ? await charactersForAccount(account.id) : []
  // Start from what each of your characters is wearing now.
  const icons = iconBase()
  const loadouts = await Promise.all(
    chars.map(async (c) => {
      const d = await getCharacter(c.name)
      const info = await itemInfo(Object.values(d?.equipment ?? {}))
      const gear: Record<number, { id: number; name: string; icon: string }> = {}
      for (const { slot } of EQUIP_GRID) {
        const id = d?.equipment[slot]
        if (id) gear[slot] = { id, name: info.get(id)?.name ?? `#${id}`, icon: info.get(id)?.hasIcon && icons ? `${icons}/${id}.png` : '' }
      }
      return { charid: c.charid, name: c.name, job: c.mjob, level: c.mlvl, gear }
    })
  )
  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>Dressing Room</h1>
          <p className="lede">Plan gear for any job and level and see the combined stats. Log in to start from your own characters and save presets.</p>
        </div>
      </div>
      <DressingRoom characters={loadouts} signedIn={!!account} />
    </div>
  )
}

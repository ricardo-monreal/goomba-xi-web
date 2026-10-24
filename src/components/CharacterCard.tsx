import Link from 'next/link'
import { jobName, nationName, raceLabel, zoneDisplayName } from '@/lib/ffxi'
import type { CharacterRow } from '@/lib/game'

/** Character card like the launcher's home screen. */
export default function CharacterCard({ c, rank }: { c: CharacterRow; rank?: number }) {
  return (
    <Link href={`/characters/${c.name}`} className="card char-card">
      <span className={`dot ${c.online ? 'on' : ''}`} title={c.online ? 'Online' : 'Offline'} />
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600 }}>{c.name}</div>
        <div className="muted small">
          {raceLabel(c.race)} · {zoneDisplayName(c.zone) || nationName(c.nation)}
        </div>
      </div>
      <div className="rank">
        {rank !== undefined && <>Rank {rank}</>}
        <b>
          {jobName(c.mjob)} {c.mlvl}
          {c.sjob ? ` / ${jobName(c.sjob)} ${c.slvl}` : ''}
        </b>
      </div>
    </Link>
  )
}

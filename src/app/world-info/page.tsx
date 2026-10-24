import Link from 'next/link'
import { ItemRef } from '@/components/Item'
import VanaClock from '@/components/VanaClock'
import transports from '@/data/transport.json'
import { GUILD_POINT_RANKS, GUILDS, zoneDisplayName } from '@/lib/ffxi'
import { CONQUEST_OWNERS, CONQUEST_REGIONS, conquest, guildPointsToday, iconBase, itemInfo, weatherZones } from '@/lib/game'
import { EARTH_MS_PER_VANA_DAY, vanaTime, WEATHER, weatherForDay, WEEKDAYS } from '@/lib/vana'
import Transports from './Transports'

export const metadata = { title: 'World Info' }

const OWNER_COLORS = ['#c0392b', '#2f6fbd', '#2e9b55', '#8a7fa6']

export default async function WorldInfo({ searchParams }: { searchParams: Promise<{ zone?: string }> }) {
  const { zone } = await searchParams
  const [regions, guild, zones] = await Promise.all([conquest(), guildPointsToday(), weatherZones()])
  const items = await itemInfo(guild.rows.map((r) => r.itemid))
  const icons = iconBase()
  const now = Date.now()
  const today = vanaTime(now)
  const days = Array.from({ length: 8 }, (_, i) => vanaTime(now + i * EARTH_MS_PER_VANA_DAY))
  const selected = zones.find((z) => String(z.zoneid) === zone) ?? zones.find((z) => z.name === 'Valkurm_Dunes') ?? zones[0]
  const ranks = [...new Set(guild.rows.map((r) => r.rank))].sort((a, b) => a - b)
  // Guild point items rotate at midnight Japan time (15:00 UTC).
  const reset = new Date(now)
  reset.setUTCHours(15, 0, 0, 0)
  if (reset.getTime() <= now) reset.setUTCDate(reset.getUTCDate() + 1)

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>World Info</h1>
          <p className="lede">Vana&apos;diel time, the moon, weather, conquest, guild points, ferries and airships.</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <section className="panel panel-pad">
          <div className="tiny muted" style={{ marginBottom: 8 }}>Vana&apos;diel time</div>
          <VanaClock />
        </section>
        <section className="panel" style={{ gridColumn: 'span 2' }}>
          <div className="panel-head">
            <h3>The week ahead</h3>
            <span className="muted small">one Vana&apos;diel day = 57.6 minutes</span>
          </div>
          <div className="panel-body days">
            {days.map((d, i) => {
              const wd = WEEKDAYS[d.weekday]
              return (
                <div key={i} className={`day ${i === 0 ? 'today' : ''}`}>
                  <div>
                    <span className="el" style={{ background: wd.color }} />
                    {wd.name}
                  </div>
                  <div className="muted small">{i === 0 ? 'Today' : `in ${Math.round((i * EARTH_MS_PER_VANA_DAY - ((today.hour * 60 + today.minute) / 1440) * EARTH_MS_PER_VANA_DAY) / 60000)} min`}</div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h3>Weather</h3>
            <form method="get">
              <select name="zone" defaultValue={selected ? String(selected.zoneid) : ''} aria-label="Zone" style={{ width: 'auto' }}>
                {zones.map((z) => (
                  <option key={z.zoneid} value={z.zoneid}>
                    {zoneDisplayName(z.name)}
                  </option>
                ))}
              </select>{' '}
              <button className="btn btn-sm" type="submit">
                Show
              </button>
            </form>
          </div>
          {selected ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Usually (50%)</th>
                  <th>Common (35%)</th>
                  <th>Rare (15%)</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d, i) => {
                  const w = weatherForDay(selected.weather, d.daysSinceEpoch)
                  const name = (n?: number) => (n === undefined ? '—' : WEATHER[n]?.name ?? '—')
                  return (
                    <tr key={i}>
                      <td>{i === 0 ? 'Today' : WEEKDAYS[d.weekday].name}</td>
                      <td>{name(w?.normal)}</td>
                      <td>{name(w?.common)}</td>
                      <td>{name(w?.rare)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="panel-body muted">No weather data yet.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Ferries &amp; airships</h3>
            <span className="muted small">live</span>
          </div>
          <Transports transports={transports} />
        </section>
      </div>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head">
          <h3>Daily guild points</h3>
          <span className="muted small">
            Pattern {guild.pattern} · rotates at {reset.toUTCString().slice(17, 22)} UTC
          </span>
        </div>
        {guild.rows.length === 0 ? (
          <p className="panel-body muted">No guild point data.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Craft</th>
                  {ranks.map((r) => (
                    <th key={r}>{GUILD_POINT_RANKS[r] ?? `Rank ${r}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GUILDS.map((g, gi) => (
                  <tr key={g}>
                    <td>{g}</td>
                    {ranks.map((r) => {
                      const row = guild.rows.find((x) => x.guildid === gi && x.rank === r)
                      return <td key={r}>{row ? <ItemRef id={row.itemid} item={items.get(row.itemid)} iconBase={icons} /> : '—'}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head">
          <h3>Conquest</h3>
          <span className="muted small">Current regional control</span>
        </div>
        {regions.length === 0 ? (
          <p className="panel-body muted">No conquest data.</p>
        ) : (
          <div className="panel-body cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {regions.map((r) => {
              const total = r.sandoria_influence + r.bastok_influence + r.windurst_influence || 1
              return (
                <div key={r.region_id} className="card" style={{ padding: 12, gap: 6 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <b>{CONQUEST_REGIONS[r.region_id] ?? `Region ${r.region_id}`}</b>
                    <span className="small" style={{ color: OWNER_COLORS[r.region_control] }}>
                      {CONQUEST_OWNERS[r.region_control] ?? '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: '#0a0c18' }}>
                    {[r.sandoria_influence, r.bastok_influence, r.windurst_influence].map((v, i) => (
                      <div key={i} style={{ width: `${(v / total) * 100}%`, background: OWNER_COLORS[i] }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
      <p className="muted small" style={{ marginTop: 16 }}>
        Looking for a specific monster or quest? The <Link href="/items">item browser</Link> lists who sells what; the community wiki covers the rest.
      </p>
    </div>
  )
}

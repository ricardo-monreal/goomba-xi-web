import Link from 'next/link'
import { jobName, nationName, raceLabel } from '@/lib/ffxi'
import { searchCharacters } from '@/lib/game'

export const metadata = { title: 'Characters' }

type SP = { q?: string; nation?: string; online?: string; page?: string }

export default async function Characters({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').replace(/[^A-Za-z]/g, '').slice(0, 15)
  const nation = sp.nation === undefined || sp.nation === '' ? undefined : Number(sp.nation)
  const online = sp.online === '1'
  const page = Math.max(1, Number(sp.page) || 1)
  const res = await searchCharacters({ q, nation, online, page })
  const pages = Math.max(1, Math.ceil(res.total / res.perPage))
  const href = (p: number) => {
    const u = new URLSearchParams()
    if (q) u.set('q', q)
    if (nation !== undefined) u.set('nation', String(nation))
    if (online) u.set('online', '1')
    if (p > 1) u.set('page', String(p))
    const s = u.toString()
    return `/characters${s ? `?${s}` : ''}`
  }

  return (
    <div className="container page" style={{ maxWidth: 900 }}>
      <div className="page-head">
        <h1>Characters</h1>
      </div>
      <form className="panel panel-pad stack" method="get">
        <div className="row">
          <input type="search" name="q" defaultValue={q} placeholder="Search by name…" aria-label="Character name" style={{ flex: 1, minWidth: 200 }} />
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </div>
        <div className="row small">
          <select name="nation" defaultValue={nation === undefined ? '' : String(nation)} style={{ width: 'auto' }} aria-label="Nation">
            <option value="">All nations</option>
            <option value="0">San d&apos;Oria</option>
            <option value="1">Bastok</option>
            <option value="2">Windurst</option>
          </select>
          <label className="check" style={{ alignItems: 'center' }}>
            <input type="checkbox" name="online" value="1" defaultChecked={online} style={{ marginTop: 0 }} /> Online only
          </label>
        </div>
      </form>

      <p className="muted small" style={{ margin: '18px 0 8px' }}>
        {res.total.toLocaleString()} character{res.total === 1 ? '' : 's'}
      </p>
      <div className="panel list">
        {res.rows.length === 0 && <p className="panel-body muted">Nobody matches that search.</p>}
        {res.rows.map((c) => (
          <Link key={c.charid} href={`/characters/${c.name}`} className="list-row">
            <span className={`dot ${c.online ? 'on' : ''}`} />
            <div>
              <div className="name">{c.name}</div>
              <div className="sub">
                {raceLabel(c.race)}
                {nationName(c.nation) ? ` · ${nationName(c.nation)}` : ''}
              </div>
            </div>
            <span className="spacer" />
            {c.anon ? (
              <span className="chip accent">Anon</span>
            ) : (
              <span className="num">
                {jobName(c.mjob)} {c.mlvl}
                {c.sjob ? <span className="muted"> /{jobName(c.sjob)} {c.slvl}</span> : null}
              </span>
            )}
          </Link>
        ))}
      </div>
      <div className="pager">
        {page > 1 ? (
          <Link className="btn" href={href(page - 1)}>
            Previous
          </Link>
        ) : (
          <span />
        )}
        <span className="muted small">
          Page {page} of {pages}
        </span>
        {page < pages ? (
          <Link className="btn" href={href(page + 1)}>
            Next
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}

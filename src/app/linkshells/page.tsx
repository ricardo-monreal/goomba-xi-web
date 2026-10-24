import Link from 'next/link'
import { linkshellColor } from '@/lib/ffxi'
import { listLinkshells } from '@/lib/game'

export const metadata = { title: 'Linkshells' }

export default async function Linkshells({ searchParams }: { searchParams: Promise<{ q?: string; recruiting?: string }> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').slice(0, 20)
  const recruiting = sp.recruiting === '1'
  const all = await listLinkshells(q || undefined)
  const shells = recruiting ? all.filter((l) => l.recruiting) : all
  return (
    <div className="container page">
      <div className="page-head">
        <h1>Linkshells</h1>
      </div>
      <form className="panel panel-pad row" method="get" style={{ marginBottom: 16 }}>
        <input type="search" name="q" defaultValue={q} placeholder="Search by name" aria-label="Linkshell name" style={{ flex: 1, minWidth: 200 }} />
        <label className="check" style={{ alignItems: 'center' }}>
          <input type="checkbox" name="recruiting" value="1" defaultChecked={recruiting} style={{ marginTop: 0 }} /> Recruiting
        </label>
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>
      <p className="muted small">{shells.length} linkshells found</p>
      <div className="cards">
        {shells.map((ls) => (
          <Link key={ls.id} href={`/linkshells/${ls.id}`} className="card">
            <div className="row" style={{ gap: 10 }}>
              <span className="ls-crest" style={{ background: linkshellColor(ls.color) }} />
              <h3>{ls.name}</h3>
            </div>
            <p className="muted small" style={{ margin: 0 }}>
              {ls.description ? ls.description.slice(0, 140) + (ls.description.length > 140 ? '…' : '') : 'This linkshell hasn’t written its page yet.'}
            </p>
            <div className="row" style={{ gap: 6 }}>
              {ls.recruiting && <span className="chip ok">Recruiting</span>}
              {ls.tags.slice(0, 4).map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
            <div className="foot">
              <span>
                <span className="ok">{ls.online} online</span> · {ls.members} total
              </span>
              {ls.leader && <span>Led by {ls.leader}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

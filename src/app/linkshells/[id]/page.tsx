import { notFound } from 'next/navigation'
import Link from 'next/link'
import { currentAccount } from '@/lib/auth'
import { jobName, linkshellColor } from '@/lib/ffxi'
import { isLinkshellHolder, linkshellMembers, listLinkshells } from '@/lib/game'
import LinkshellEditor from './LinkshellEditor'

const ROLE: Record<number, string> = { 513: 'Linkshell', 514: 'Pearlsack', 515: 'Linkpearl' }

export default async function LinkshellPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const ls = (await listLinkshells()).find((l) => l.id === id)
  if (!ls) notFound()
  const [members, account] = await Promise.all([linkshellMembers(id), currentAccount()])
  const holder = account ? await isLinkshellHolder(account.id, id) : false
  return (
    <div className="container page">
      <Link href="/linkshells" className="small">
        ← All linkshells
      </Link>
      <div className="page-head" style={{ marginTop: 16 }}>
        <div className="row" style={{ gap: 14 }}>
          <span className="ls-crest" style={{ background: linkshellColor(ls.color), width: 36, height: 36 }} />
          <h1>{ls.name}</h1>
        </div>
        <div className="row">
          {ls.recruiting && <span className="chip ok">Recruiting</span>}
          <span className="chip">
            {ls.online} online · {ls.members} members
          </span>
        </div>
      </div>
      <div className="grid-2">
        <section className="stack">
          <div className="panel panel-pad">
            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }} className={ls.description ? '' : 'muted'}>
              {ls.description || 'This linkshell hasn’t written its page yet.'}
            </p>
            {ls.tags.length > 0 && (
              <div className="row" style={{ gap: 6, marginTop: 14 }}>
                {ls.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          {holder && <LinkshellEditor id={id} initial={{ description: ls.description, tags: ls.tags.join(', '), recruiting: ls.recruiting }} />}
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3>Members</h3>
          </div>
          <div className="list">
            {members.map((m) => (
              <Link key={m.name} href={`/characters/${m.name}`} className="list-row">
                <span className={`dot ${m.online ? 'on' : ''}`} />
                <span className="name">{m.name}</span>
                <span className="muted small">{ROLE[m.itemId]}</span>
                <span className="spacer" />
                {m.anon ? <span className="chip accent">Anon</span> : <span className="num">{jobName(m.mjob)} {m.mlvl}</span>}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

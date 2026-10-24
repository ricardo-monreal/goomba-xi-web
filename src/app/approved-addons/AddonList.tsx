'use client'

import { useMemo, useState } from 'react'

interface Addon {
  name: string
  programs: string[]
  condition?: string
}

const PROGRAMS = ['All', 'Ashita', 'Windower', 'Standalone']

export default function AddonList({ addons }: { addons: Addon[] }) {
  const [q, setQ] = useState('')
  const [program, setProgram] = useState('All')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return addons.filter(
      (a) =>
        (program === 'All' || a.programs.includes(program)) &&
        (!s || a.name.toLowerCase().includes(s) || a.programs.some((p) => p.toLowerCase().includes(s)))
    )
  }, [addons, q, program])

  const groups = useMemo(() => {
    const m = new Map<string, Addon[]>()
    for (const a of filtered) {
      const letter = /^[a-z]/i.test(a.name) ? a.name[0].toUpperCase() : '#'
      m.set(letter, [...(m.get(letter) ?? []), a])
    }
    return [...m.entries()]
  }, [filtered])

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="panel panel-pad stack">
        <h2 style={{ margin: 0 }}>The Approved Addon List</h2>
        <p className="muted small" style={{ margin: 0 }}>
          A to Z. The program is the launcher the ruling was made for.
        </p>
        <div className="row">
          <input
            type="search"
            placeholder="Search by tool or program"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ maxWidth: 420 }}
            aria-label="Search tools"
          />
          <div className="filters" role="group" aria-label="Program">
            {PROGRAMS.map((p) => (
              <button key={p} type="button" className={`filter ${program === p ? 'active' : ''}`} onClick={() => setProgram(p)}>
                {p}
              </button>
            ))}
          </div>
          <span className="spacer" />
          <span className="chip accent">{filtered.length} approved tools</span>
        </div>
        <nav className="alpha" aria-label="Jump to letter">
          {groups.map(([l]) => (
            <a key={l} href={`#addons-${l}`}>
              {l}
            </a>
          ))}
        </nav>
      </div>

      {groups.map(([letter, list]) => (
        <section key={letter} id={`addons-${letter}`} className="addon-letter">
          <div className="row" style={{ marginBottom: 10 }}>
            <h2 style={{ margin: 0 }}>{letter}</h2>
            <span className="muted small">
              {list.length} tool{list.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="addon-list">
            {list.map((a, i) => (
              <div key={`${a.name}-${i}`} className="addon">
                <div>
                  <div className="name">{a.name}</div>
                  {a.condition && <div className="cond">Required: {a.condition}</div>}
                </div>
                <div className="progs">
                  {a.programs.map((p) => (
                    <span key={p} className="chip">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      {groups.length === 0 && <p className="muted">No tools match that search.</p>}
    </div>
  )
}

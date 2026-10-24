import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ItemIcon, ItemRef } from '@/components/Item'
import { currentAccount } from '@/lib/auth'
import {
  CONTAINERS, CRAFTS, EQUIP_GRID, ERA_JOBS, expForLevel, fameAreas, formatGil, formatPlaytime, JOB_NAMES, jobName,
  MAAT_CAP, nationName, raceLabel, zoneDisplayName
} from '@/lib/ffxi'
import {
  characterAuctions, characterBazaar, characterDelivery, characterInventory, getCharacter, iconBase, itemInfo, privacyFor
} from '@/lib/game'
import PrivacyForm from './PrivacyForm'

const TABS = [
  { id: 'overview', label: 'Overview', owner: false },
  { id: 'inventory', label: 'Inventory', owner: true },
  { id: 'auctions', label: 'Auctions', owner: true },
  { id: 'delivery', label: 'Delivery', owner: true },
  { id: 'bazaar', label: 'Bazaar', owner: true },
  { id: 'settings', label: 'Settings', owner: true }
]

/** The 15 jobs Maat tests (bit = job id - 1 in the maatsCap char var). */
const MAAT_JOBS = ERA_JOBS.slice(0, 15)
const NATION_COLORS = ['#c0392b', '#2f6fbd', '#2e9b55']

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  return { title: decodeURIComponent((await params).name) }
}

export default async function CharacterPage({ params, searchParams }: { params: Promise<{ name: string }>; searchParams: Promise<{ tab?: string }> }) {
  const name = decodeURIComponent((await params).name)
  const { tab: tabParam } = await searchParams
  const [c, account] = await Promise.all([getCharacter(name), currentAccount()])
  if (!c) notFound()
  const owner = !!account && account.id === c.accid
  const tab = TABS.find((t) => t.id === tabParam && (!t.owner || owner))?.id ?? 'overview'
  const icons = iconBase()

  if (c.hideProfile && !owner) {
    return (
      <div className="narrow page">
        <h1>{c.name}</h1>
        <p className="muted">This adventurer keeps their profile private.</p>
      </div>
    )
  }
  const showJobs = owner || !c.anon

  return (
    <div className="container page">
      <div className="char-head">
        <div>
          <h1>{c.name.toUpperCase()}</h1>
          <div className="num" style={{ fontSize: 17 }}>
            {showJobs ? (
              <>
                {jobName(c.mjob)} {c.mlvl}
                {c.sjob ? <span className="muted"> / {jobName(c.sjob)} {c.slvl}</span> : null}
              </>
            ) : (
              <span className="chip accent">Anon</span>
            )}
          </div>
          <div className="muted">{raceLabel(c.race)}</div>
        </div>
        <div className="char-meta">
          <div>
            {nationName(c.nation)} · Rank {c.rank}
          </div>
          <div className="num">
            ⏱ {formatPlaytime(c.playtime)}
            {owner && <> · {formatGil(c.gil)} gil</>}
          </div>
          <div className={c.online ? 'ok' : 'muted'} style={{ letterSpacing: '0.14em', fontSize: 12, fontWeight: 600 }}>
            {c.online ? `ONLINE · ${zoneDisplayName(c.zone).toUpperCase()}` : 'OFFLINE'}
          </div>
        </div>
      </div>

      {owner && (
        <nav className="tabs" aria-label="Character sections">
          {TABS.map((t) => (
            <Link key={t.id} href={`/characters/${c.name}${t.id === 'overview' ? '' : `?tab=${t.id}`}`} className={tab === t.id ? 'active' : ''}>
              {t.label}
            </Link>
          ))}
        </nav>
      )}

      {tab === 'overview' && <Overview c={c} showJobs={showJobs} icons={icons} />}
      {tab === 'inventory' && <Inventory charid={c.charid} icons={icons} />}
      {tab === 'auctions' && <Auctions charid={c.charid} icons={icons} />}
      {tab === 'delivery' && <Delivery charid={c.charid} icons={icons} />}
      {tab === 'bazaar' && <Bazaar charid={c.charid} icons={icons} />}
      {tab === 'settings' && <PrivacyForm name={c.name} initial={await privacyFor(c.charid)} />}
    </div>
  )
}

type Char = NonNullable<Awaited<ReturnType<typeof getCharacter>>>

async function Overview({ c, showJobs, icons }: { c: Char; showJobs: boolean; icons: string }) {
  const items = await itemInfo(Object.values(c.equipment))
  const levels = ERA_JOBS.map((j) => c.jobs[j] ?? 0)
  const levelTotal = levels.reduce((a, b) => a + b, 0)
  const expTotal = ERA_JOBS.reduce((sum, j) => sum + (c.jobs[j] ? expForLevel(c.jobs[j]) + (c.exp[j] ?? 0) : 0), 0)
  const capExp = expForLevel(MAAT_CAP)
  const toCap = MAAT_JOBS.reduce((sum, j) => sum + Math.max(0, capExp - (c.jobs[j] ? expForLevel(c.jobs[j]) + (c.exp[j] ?? 0) : 0)), 0)
  const maatDone = MAAT_JOBS.filter((_, i) => c.maatsCap & (1 << i)).length
  const mainJob = jobName(c.mjob)

  return (
    <div className="char-grid">
      <div className="stack">
        <section className="panel">
          <div className="panel-head">
            <h3>Adventurer</h3>
            <span className="muted small">{raceLabel(c.race)}</span>
          </div>
          <div className="portrait">
            <Silhouette race={c.race} />
          </div>
          <div className="panel-body small muted">Created {new Date(c.created).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3>Equipment</h3>
          </div>
          <div className="equip-grid">
            {EQUIP_GRID.map(({ slot, label }) => {
              const id = c.equipment[slot]
              const item = id ? items.get(id) : undefined
              return id ? (
                <Link key={slot} href={`/items/${id}`} className="equip-slot filled" aria-label={`${label}: ${item?.name ?? id}`}>
                  {item?.hasIcon && icons ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${icons}/${id}.png`} alt="" />
                  ) : (
                    <span style={{ color: 'var(--text-2)' }}>{label}</span>
                  )}
                  <span className="tip">{item?.name ?? `Item #${id}`}</span>
                </Link>
              ) : (
                <div key={slot} className="equip-slot">
                  {label}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <div className="stack">
        <section className="panel">
          <div className="panel-head">
            <h3>Jobs</h3>
            <span className="muted small">{showJobs ? `${levelTotal} total levels` : 'Hidden'}</span>
          </div>
          <div className="panel-body">
            {showJobs ? (
              <div className="job-grid">
                {ERA_JOBS.map((j) => (
                  <div key={j} className={`job ${j === mainJob ? 'current' : ''} ${c.jobs[j] ? '' : 'zero'}`} title={JOB_NAMES[j]}>
                    <div className="abbr">{j}</div>
                    <div className="lvl">{c.jobs[j] ?? 0}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">This adventurer has chosen to keep their jobs private.</p>
            )}
          </div>
        </section>
        {showJobs && (
          <section className="panel">
            <div className="panel-head">
              <h3>Experience</h3>
            </div>
            <dl className="panel-body" style={{ margin: 0 }}>
              <div className="kv"><dt>Level total</dt><dd>{levelTotal}</dd></div>
              <div className="kv"><dt>Exp total</dt><dd>{expTotal.toLocaleString()}</dd></div>
              <div className="kv"><dt>Maat jobs</dt><dd>{maatDone}/{MAAT_JOBS.length}</dd></div>
              <div className="kv"><dt>Exp to Maat cap</dt><dd>{toCap.toLocaleString()}</dd></div>
              <div className="kv"><dt>Level cap</dt><dd>{c.genkai}</dd></div>
            </dl>
          </section>
        )}
      </div>

      <div className="stack">
        <section className="panel">
          <div className="panel-head">
            <h3>Professions</h3>
          </div>
          <div className="panel-body craft-grid">
            {CRAFTS.map((cr) => (
              <div key={cr.id} className="craft">
                <div className="label">{cr.name}</div>
                <div className="value">{((c.crafts[cr.id] ?? 0) / 10).toFixed(1)}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3>Missions</h3>
            <span className="muted small">completed</span>
          </div>
          <dl className="panel-body" style={{ margin: 0 }}>
            {c.missions.map((m) => (
              <div key={m.name} className="kv">
                <dt>{m.name}</dt>
                <dd>{m.completed}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3>Fame</h3>
          </div>
          <div className="panel-body">
            {fameAreas(c.profile).map((f, i) => (
              <div key={f.key} className="fame">
                <span className="crest" style={{ background: NATION_COLORS[i] ?? 'var(--accent)' }}>
                  {f.name[0]}
                </span>
                <span className="tiny" style={{ color: 'var(--text-2)' }}>{f.name}</span>
                <b className="num">Rank {f.level}</b>
                <div className="bar">
                  <div style={{ width: `${Math.round(f.progress * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

/** Simple race silhouette (original art) for the portrait panel. */
function Silhouette({ race }: { race: number }) {
  const small = race === 5 || race === 6
  const large = race === 8
  const sx = small ? 0.72 : large ? 1.12 : 1
  const sy = small ? 0.62 : large ? 1.0 : 1
  return (
    <svg viewBox="0 0 100 140" aria-hidden>
      <defs>
        <linearGradient id="sil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b437d" />
          <stop offset="1" stopColor="#1c2140" />
        </linearGradient>
      </defs>
      <g transform={`translate(50 138) scale(${sx} ${sy}) translate(-50 -138)`} fill="url(#sil)" stroke="#6f7bff" strokeOpacity="0.35">
        <circle cx="50" cy="24" r="13" />
        {race === 7 && (
          <>
            <path d="M39 16 l-4 -10 l9 6 z" />
            <path d="M61 16 l4 -10 l-9 6 z" />
          </>
        )}
        {(race === 3 || race === 4) && (
          <>
            <path d="M37 24 l-9 -4 l9 7 z" />
            <path d="M63 24 l9 -4 l-9 7 z" />
          </>
        )}
        <path d="M30 44 Q50 34 70 44 L76 84 L66 86 L64 64 L62 92 L66 136 L54 136 L50 98 L46 136 L34 136 L38 92 L36 64 L34 86 L24 84 Z" />
      </g>
    </svg>
  )
}

async function Inventory({ charid, icons }: { charid: number; icons: string }) {
  const rows = await characterInventory(charid)
  const items = await itemInfo(rows.map((r) => r.itemId))
  const groups = CONTAINERS.map((ct) => ({ ...ct, rows: rows.filter((r) => r.location === ct.id) })).filter((g) => g.rows.length)
  if (!groups.length) return <p className="muted">Nothing here yet.</p>
  return (
    <div className="grid-2">
      {groups.map((g) => (
        <section key={g.id} className="panel">
          <div className="panel-head">
            <h3>{g.name}</h3>
            <span className="muted small">{g.rows.length} items</span>
          </div>
          <div className="list">
            {g.rows.map((r) => (
              <div key={`${r.location}-${r.slot}`} className="list-row">
                <ItemRef id={r.itemId} item={items.get(r.itemId)} iconBase={icons} qty={r.quantity} />
                <span className="spacer" />
                {r.bazaar > 0 && <span className="chip accent">Bazaar {formatGil(r.bazaar)}</span>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const fmtTime = (unix: number) => (unix ? new Date(unix * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '')

async function Auctions({ charid, icons }: { charid: number; icons: string }) {
  const a = await characterAuctions(charid)
  const items = await itemInfo([...a.listed, ...a.sold, ...a.bought].map((r) => r.itemid))
  const Table = ({ title, rows, cols }: { title: string; rows: { id: number; itemid: number; stack: number }[]; cols: [string, (r: never) => React.ReactNode][] }) => (
    <section className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-head">
        <h3>{title}</h3>
        <span className="muted small">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="panel-body muted">None.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              {cols.map(([h]) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <ItemRef id={r.itemid} item={items.get(r.itemid)} iconBase={icons} />
                  {r.stack ? <span className="chip" style={{ marginLeft: 8 }}>Stack</span> : null}
                </td>
                {cols.map(([h, f]) => (
                  <td key={h} className="num">
                    {f(r as never)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
  return (
    <>
      <Table title="On sale" rows={a.listed} cols={[['Price', (r: { price: number }) => formatGil(r.price)], ['Listed', (r: { date: number }) => fmtTime(r.date)]]} />
      <Table title="Sold" rows={a.sold} cols={[['Price', (r: { sale: number }) => formatGil(r.sale)], ['Buyer', (r: { buyer_name: string }) => r.buyer_name], ['When', (r: { sell_date: number }) => fmtTime(r.sell_date)]]} />
      <Table title="Bought" rows={a.bought} cols={[['Price', (r: { sale: number }) => formatGil(r.sale)], ['Seller', (r: { seller_name: string }) => r.seller_name], ['When', (r: { sell_date: number }) => fmtTime(r.sell_date)]]} />
    </>
  )
}

async function Delivery({ charid, icons }: { charid: number; icons: string }) {
  const rows = await characterDelivery(charid)
  const items = await itemInfo(rows.map((r) => r.itemid))
  const box = (n: number, title: string, who: (r: (typeof rows)[number]) => string) => {
    const list = rows.filter((r) => r.box === n)
    return (
      <section className="panel">
        <div className="panel-head">
          <h3>{title}</h3>
          <span className="muted small">{list.length}/8</span>
        </div>
        <div className="list">
          {list.length === 0 && <p className="panel-body muted">Empty.</p>}
          {list.map((r) => (
            <div key={r.slot} className="list-row">
              <ItemRef id={r.itemid} item={items.get(r.itemid)} iconBase={icons} qty={r.quantity} />
              <span className="spacer" />
              <span className="muted small">{who(r)}</span>
            </div>
          ))}
        </div>
      </section>
    )
  }
  return (
    <div className="grid-2">
      {box(1, 'Incoming', (r) => (r.sender ? `from ${r.sender}` : ''))}
      {box(2, 'Outgoing', (r) => (r.charname ? `to ${r.charname}` : ''))}
    </div>
  )
}

async function Bazaar({ charid, icons }: { charid: number; icons: string }) {
  const rows = await characterBazaar(charid)
  const items = await itemInfo(rows.map((r) => r.itemId))
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>Your bazaar</h3>
        <span className="muted small">Set prices in game with /bazaar</span>
      </div>
      <div className="list">
        {rows.length === 0 && <p className="panel-body muted">Nothing for sale.</p>}
        {rows.map((r, i) => (
          <div key={i} className="list-row">
            <ItemIcon item={items.get(r.itemId)} iconBase={icons} />
            <Link href={`/items/${r.itemId}`}>{items.get(r.itemId)?.name ?? `Item #${r.itemId}`}</Link>
            {r.quantity > 1 && <span className="muted">×{r.quantity}</span>}
            <span className="spacer" />
            <span className="num">{formatGil(r.bazaar)} gil</span>
          </div>
        ))}
      </div>
    </section>
  )
}

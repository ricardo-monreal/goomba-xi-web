import Link from 'next/link'
import { ItemIcon } from '@/components/Item'
import { formatGil, zoneDisplayName } from '@/lib/ffxi'
import { bazaarSellers, bazaarSummary, iconBase, itemInfo } from '@/lib/game'

export const metadata = { title: 'Bazaar Search' }

type SP = { q?: string; item?: string; online?: string }

export default async function BazaarPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').slice(0, 40)
  const onlineOnly = sp.online === '1'
  const selected = Number(sp.item) || 0
  const icons = iconBase()
  const summary = (await bazaarSummary(q || undefined)).filter((s) => !onlineOnly || s.onlineSellers > 0)
  const sellers = selected ? (await bazaarSellers(selected)).filter((s) => !onlineOnly || s.online) : []
  const items = await itemInfo([...summary.map((s) => s.itemId), selected])
  const link = (item?: number) => {
    const u = new URLSearchParams()
    if (q) u.set('q', q)
    if (onlineOnly) u.set('online', '1')
    if (item) u.set('item', String(item))
    return `/bazaar?${u.toString()}`
  }

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>Bazaar Search</h1>
          <p className="lede">Search every player bazaar for an item. Listings refresh as players change their prices.</p>
        </div>
      </div>
      <form className="panel panel-pad row" method="get" style={{ marginBottom: 20 }}>
        <input type="search" name="q" defaultValue={q} placeholder="Fire crystal, bronze sword…" aria-label="Item name" style={{ flex: 1, minWidth: 220 }} />
        <label className="check" style={{ alignItems: 'center' }}>
          <input type="checkbox" name="online" value="1" defaultChecked={onlineOnly} style={{ marginTop: 0 }} /> Online sellers only
        </label>
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>
      <div className="dress" style={{ gridTemplateColumns: '380px 1fr' }}>
        <section className="panel">
          <div className="panel-head">
            <span className="tiny muted">{summary.length} items for sale · most listed first</span>
          </div>
          <div className="list" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {summary.length === 0 && <p className="panel-body muted">No bazaars are selling that right now.</p>}
            {summary.map((s) => {
              const it = items.get(s.itemId)
              return (
                <Link key={s.itemId} href={link(s.itemId)} className="list-row" style={s.itemId === selected ? { background: 'var(--panel-2)' } : undefined}>
                  <ItemIcon item={it} iconBase={icons} />
                  <div>
                    <div className="name">{it?.name ?? `Item #${s.itemId}`}</div>
                    <div className="sub">
                      {s.listings} listing{s.listings === 1 ? '' : 's'} · {s.sellers} seller{s.sellers === 1 ? '' : 's'}
                    </div>
                  </div>
                  <span className="spacer" />
                  <div style={{ textAlign: 'right' }}>
                    <div className="tiny muted">from</div>
                    <div className="num">{formatGil(s.minPrice)}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3>{selected ? items.get(selected)?.name ?? `Item #${selected}` : 'Listings'}</h3>
            {selected ? <Link href={`/items/${selected}`} className="small">Item details →</Link> : null}
          </div>
          {!selected ? (
            <p className="panel-body muted">Choose an item to see every seller.</p>
          ) : sellers.length === 0 ? (
            <p className="panel-body muted">Nobody is selling this right now.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Where</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`dot ${s.online ? 'on' : ''}`} /> <Link href={`/characters/${s.name}`}>{s.name}</Link>
                    </td>
                    <td className="num">{formatGil(s.price)}</td>
                    <td className="num">{s.quantity}</td>
                    <td className="muted">{s.online ? zoneDisplayName(s.zone) : 'Offline'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}

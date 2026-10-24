import Link from 'next/link'
import { ItemRef } from '@/components/Item'
import { AH_CATEGORIES, AH_GROUPS, slotLabels } from '@/lib/ffxi'
import { iconBase, itemInfo } from '@/lib/game'
import { searchItems } from '@/lib/items'

export const metadata = { title: 'Item Browser' }

export default async function Items({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string; page?: string }> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').slice(0, 40)
  const cat = Number(sp.cat) || 0
  const page = Math.max(1, Number(sp.page) || 1)
  const res = await searchItems({ q: q || undefined, category: cat || undefined, page })
  const items = await itemInfo(res.rows.map((r) => r.itemid))
  const icons = iconBase()
  const pages = Math.max(1, Math.ceil(res.total / res.perPage))
  const href = (p: number) => {
    const u = new URLSearchParams()
    if (q) u.set('q', q)
    if (cat) u.set('cat', String(cat))
    if (p > 1) u.set('page', String(p))
    return `/items?${u}`
  }
  return (
    <div className="container page">
      <div className="page-head">
        <h1>Item Browser</h1>
      </div>
      <form className="panel panel-pad row" method="get" style={{ marginBottom: 20 }}>
        <input type="search" name="q" defaultValue={q} placeholder="Search items by name…" aria-label="Item name" style={{ flex: 1, minWidth: 220 }} />
        <select name="cat" defaultValue={cat ? String(cat) : ''} style={{ width: 'auto' }} aria-label="Category">
          <option value="">All categories</option>
          {AH_GROUPS.map((g) => (
            <optgroup key={g.name} label={g.name}>
              {g.ids.map((id) => (
                <option key={id} value={id}>
                  {AH_CATEGORIES[id]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>
      <section className="panel">
        <div className="panel-head">
          <h3>Catalog</h3>
          <span className="muted small">{res.total.toLocaleString()} items</span>
        </div>
        <div className="list">
          {res.rows.length === 0 && <p className="panel-body muted">No items match.</p>}
          {res.rows.map((r) => (
            <div key={r.itemid} className="list-row">
              <ItemRef id={r.itemid} item={items.get(r.itemid)} iconBase={icons} />
              <span className="spacer" />
              <span className="muted small">
                {[AH_CATEGORIES[r.aH], r.slot ? slotLabels(r.slot).join(', ') : '', r.level ? `Lv. ${r.level}` : '', `#${r.itemid}`].filter(Boolean).join(' · ')}
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className="pager">
        {page > 1 ? <Link className="btn" href={href(page - 1)}>Previous</Link> : <span />}
        <span className="muted small">
          Page {page} of {pages}
        </span>
        {page < pages ? <Link className="btn" href={href(page + 1)}>Next</Link> : <span />}
      </div>
    </div>
  )
}

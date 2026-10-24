import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ItemIcon } from '@/components/Item'
import { AH_CATEGORIES, formatGil, ITEM_FLAGS, jobsFromMask, slotLabels, formatModValue } from '@/lib/ffxi'
import { iconBase, itemInfo } from '@/lib/game'
import { itemDetail, skillName } from '@/lib/items'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const info = (await itemInfo([id])).get(id)
  return { title: info?.name ?? 'Item' }
}


export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0 || id >= 65535) notFound()
  const [info, detail] = await Promise.all([itemInfo([id]).then((m) => m.get(id)), itemDetail(id)])
  if (!info || !detail) notFound()
  const icons = iconBase()
  const recentSingles = detail.ah.recent.filter((r) => !r.stack)
  const avg = recentSingles.length ? Math.round(recentSingles.reduce((s, r) => s + r.sale, 0) / recentSingles.length) : 0
  return (
    <div className="container page">
      <Link href="/items" className="small">
        ← Item Browser
      </Link>
      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="panel">
          <div className="panel-body stack">
            <div className="row" style={{ gap: 14 }}>
              <ItemIcon item={info} iconBase={icons} />
              <div>
                <h1 style={{ margin: 0, fontSize: 28 }}>{info.name}</h1>
                <div className="row" style={{ gap: 6 }}>
                  {info.flags & ITEM_FLAGS.RARE ? <span className="tag-rare">RARE</span> : null}
                  {info.flags & ITEM_FLAGS.EX ? <span className="tag-ex">EX</span> : null}
                  <span className="muted small">
                    #{id} · {AH_CATEGORIES[info.ah] ?? 'Not sold on the auction house'}
                    {info.stackSize > 1 ? ` · stacks to ${info.stackSize}` : ''}
                  </span>
                </div>
              </div>
            </div>
            {info.description && <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--sans)', margin: 0 }}>{info.description}</pre>}
            {detail.weapon && (
              <div className="row small">
                {skillName(detail.weapon.skill) && <span className="chip">{skillName(detail.weapon.skill)}</span>}
                <span>DMG: {detail.weapon.dmg}</span>
                <span>Delay: {detail.weapon.delay}</span>
              </div>
            )}
            {detail.equipment && (
              <dl style={{ margin: 0 }}>
                <div className="kv"><dt>Level</dt><dd>{detail.equipment.level}</dd></div>
                <div className="kv"><dt>Slot</dt><dd>{slotLabels(detail.equipment.slot).join(', ') || '—'}</dd></div>
                <div className="kv"><dt>Jobs</dt><dd style={{ textAlign: 'right' }}>{jobsFromMask(detail.equipment.jobs).join(' ') || '—'}</dd></div>
              </dl>
            )}
            {detail.mods.length > 0 && (
              <div>
                <div className="tiny muted" style={{ marginBottom: 6 }}>Stats</div>
                <div className="stat-table">
                  {detail.mods.map((m) => (
                    <div key={m.id} style={{ display: 'contents' }}>
                      <span>{m.name}</span>
                      <span className="num">{formatModValue(m.id, m.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
        <section className="stack">
          <div className="panel">
            <div className="panel-head">
              <h3>Auction House</h3>
              <span className="muted small">
                {detail.ah.onSale} single · {detail.ah.onSaleStacks} stack on sale
              </span>
            </div>
            {detail.ah.recent.length === 0 ? (
              <p className="panel-body muted">No recent sales.</p>
            ) : (
              <>
                {avg > 0 && <p className="panel-body" style={{ paddingBottom: 0 }}>Average of the last {recentSingles.length} single sales: <b className="num">{formatGil(avg)} gil</b></p>}
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Seller</th>
                      <th>Buyer</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.ah.recent.map((r, i) => (
                      <tr key={i}>
                        <td className="muted">{new Date(r.sell_date * 1000).toLocaleDateString()}</td>
                        <td>{r.seller_name}</td>
                        <td>{r.buyer_name}</td>
                        <td className="num">
                          {formatGil(r.sale)}
                          {r.stack ? <span className="chip" style={{ marginLeft: 6 }}>Stack</span> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
          <div className="panel panel-pad row">
            <span>
              {detail.bazaarSellers > 0 ? `${detail.bazaarSellers} player${detail.bazaarSellers === 1 ? ' is' : 's are'} selling this in their bazaar.` : 'Nobody has this in their bazaar.'}
            </span>
            <span className="spacer" />
            {detail.bazaarSellers > 0 && (
              <Link className="btn btn-sm" href={`/bazaar?item=${id}`}>
                See sellers
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

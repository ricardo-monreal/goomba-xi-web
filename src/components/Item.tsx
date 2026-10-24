import Link from 'next/link'
import { ITEM_FLAGS } from '@/lib/ffxi'
import type { ItemInfo } from '@/lib/game'

export function ItemIcon({ item, iconBase }: { item?: ItemInfo; iconBase: string }) {
  if (item?.hasIcon && iconBase) {
    return (
      <span className="item-icon">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${iconBase}/${item.id}.png`} alt="" loading="lazy" />
      </span>
    )
  }
  return <span className="item-icon">◆</span>
}

export function ItemRef({ id, item, iconBase, qty }: { id: number; item?: ItemInfo; iconBase: string; qty?: number }) {
  const name = item?.name ?? `Item #${id}`
  return (
    <Link href={`/items/${id}`} className="item-ref">
      <ItemIcon item={item} iconBase={iconBase} />
      <span className="item-name">
        {name}
        {qty && qty > 1 ? <span className="muted"> ×{qty}</span> : null}
      </span>
      {item && item.flags & ITEM_FLAGS.RARE ? <span className="tag-rare">RARE</span> : null}
      {item && item.flags & ITEM_FLAGS.EX ? <span className="tag-ex">EX</span> : null}
    </Link>
  )
}

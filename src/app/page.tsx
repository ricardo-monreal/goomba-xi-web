import Link from 'next/link'
import BrandMark from '@/components/BrandMark'
import VanaClock from '@/components/VanaClock'
import { allPosts, formatDate } from '@/lib/blog'
import { onlineCount } from '@/lib/db'
import { downloads, SITE_TAGLINE } from '@/lib/site'
import { FEATURES } from '@/data/features'

export default async function Home() {
  const posts = allPosts().slice(0, 3)
  const online = await onlineCount()
  const dl = downloads()
  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <div className="eyebrow">Level 75 · Treasures of Aht Urhgan era</div>
            <h1>
              GOOMBA <span>XI</span>
            </h1>
            <p className="lede">{SITE_TAGLINE} The nations, Zilart, Promathia and Aht Urhgan, the way they were, with the community that made them.</p>
            <div className="row" style={{ marginTop: 28 }}>
              {dl.windows ? (
                <a className="btn btn-primary btn-lg" href={dl.windows}>
                  Play on Windows
                </a>
              ) : (
                <Link className="btn btn-primary btn-lg" href="/getting-started">
                  Play on Windows
                </Link>
              )}
              <Link className="btn btn-lg" href="/getting-started#linux">
                Play on Linux &amp; Steam Deck
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 16 }}>
              <span className="dot on" /> {online.toLocaleString()} {online === 1 ? 'adventurer' : 'adventurers'} online now ·{' '}
              <Link href="/register">Create a free account</Link>
            </p>
          </div>
          <BrandMark className="hero-art" title="Goomba XI" />
        </div>
      </section>

      <section className="container page">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Server features</h2>
          <Link href="/overview#features" className="small">
            All the details →
          </Link>
        </div>
        <div className="cards" style={{ marginBottom: 40 }}>
          {FEATURES.map((f) => (
            <Link key={f.title} href="/overview#features" className="card">
              <span className="feature-badge">{f.badge}</span>
              <h3>{f.title}</h3>
              <p className="muted" style={{ margin: 0 }}>
                {f.summary}
              </p>
            </Link>
          ))}
        </div>

        <div className="grid-3">
          <div className="panel" style={{ gridColumn: 'span 2' }}>
            <div className="panel-head">
              <h2>News</h2>
              <Link href="/blog" className="small">
                All posts →
              </Link>
            </div>
            <div className="list">
              {posts.length === 0 && <p className="panel-body muted">No news yet.</p>}
              {posts.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="list-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
                  <span className="tiny muted">{formatDate(p.date)}</span>
                  <span className="name" style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>
                    {p.title}
                  </span>
                  {p.summary && <span className="sub">{p.summary}</span>}
                </Link>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <h2>Vana&apos;diel</h2>
              <Link href="/world-info" className="small">
                World info →
              </Link>
            </div>
            <div className="panel-body">
              <VanaClock />
            </div>
          </div>
        </div>

        <h2 style={{ marginTop: 40 }}>Tools</h2>
        <div className="cards">
          {[
            ['/characters', 'Characters', 'Look up any adventurer: jobs, crafts, fame and gear.'],
            ['/linkshells', 'Linkshells', 'Browse linkshells and see who is recruiting.'],
            ['/yells', 'Yells', 'Parties forming and goods for sale, as they happen.'],
            ['/bazaar', 'Bazaar', 'Every item players have up in their bazaars.'],
            ['/items', 'Item Browser', 'Stats, auction prices and sellers for every item.'],
            ['/world-info', 'World Info', 'Weather, conquest, guild points, ferries and airships.']
          ].map(([href, title, text]) => (
            <Link key={href} href={href} className="card">
              <h3>{title}</h3>
              <p className="muted" style={{ margin: 0 }}>
                {text}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

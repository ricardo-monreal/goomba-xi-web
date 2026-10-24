import Link from 'next/link'
import { currentAccount } from '@/lib/auth'
import { onlineCount } from '@/lib/db'
import { socialLinks, wikiUrl } from '@/lib/site'
import BrandMark from './BrandMark'

const ABOUT = [
  { href: '/getting-started', label: 'Getting Started', sub: 'Install, connect, and begin your journey.' },
  { href: '/overview', label: 'Overview', sub: 'The era, the rules of play, the server philosophy.' },
  { href: '/rules', label: 'Rules', sub: 'The standards that keep Goomba welcoming.' },
  { href: '/approved-addons', label: 'Approved Addons', sub: 'Permitted addons, plugins, and tools.' },
  { href: '/faq', label: 'FAQ', sub: 'Answers about gameplay and the community.' }
]

const TOOLS = [
  { href: '/characters', label: 'Characters', sub: 'Search every adventurer on the server.' },
  { href: '/linkshells', label: 'Linkshells', sub: 'Find a linkshell to call home.' },
  { href: '/yells', label: 'Yells', sub: 'Parties, events and trades from across Vana’diel.' },
  { href: '/bazaar', label: 'Bazaar', sub: 'What players are selling right now.' },
  { href: '/items', label: 'Item Browser', sub: 'Stats, auction history and who sells it.' },
  { href: '/dressing-room', label: 'Dressing Room', sub: 'Plan gear sets and compare stats.' },
  { href: '/world-info', label: 'World Info', sub: 'Vana’diel time, moon, weather, ferries.' }
]

export default async function Header() {
  const [account, online] = await Promise.all([currentAccount().catch(() => null), onlineCount()])
  const wiki = wikiUrl()
  return (
    <header className="site-header">
      <div className="container bar">
        <Link href="/" className="brand" aria-label="Goomba XI home">
          <BrandMark />
          <span className="brand-name">
            GOOMBA <span>XI</span>
          </span>
        </Link>
        <span className="online" title="Characters online right now">
          <span className="dot on" /> {online.toLocaleString()} online
        </span>
        <nav className="nav" aria-label="Main">
          <Link href="/blog">Blog</Link>
          <div className="nav-drop">
            <button type="button">About ▾</button>
            <div className="nav-menu">
              {ABOUT.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                  <span>{l.sub}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="nav-drop">
            <button type="button">Tools ▾</button>
            <div className="nav-menu">
              {TOOLS.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                  <span>{l.sub}</span>
                </Link>
              ))}
            </div>
          </div>
          {wiki && (
            <a href={wiki} target="_blank" rel="noreferrer">
              Wiki ↗
            </a>
          )}
          {socialLinks().map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
        </nav>
        <div className="header-right">
          {account ? (
            <>
              <Link href="/account" className="btn btn-sm">
                {account.login}
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="btn btn-sm btn-ghost" type="submit">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-sm btn-ghost">
                Log in
              </Link>
              <Link href="/register" className="btn btn-sm btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

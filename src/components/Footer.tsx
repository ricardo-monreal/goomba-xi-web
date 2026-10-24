import Link from 'next/link'
import { socialLinks } from '@/lib/site'
import BrandMark from './BrandMark'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container cols">
        <div className="row">
          <BrandMark />
          <div>
            <div style={{ color: 'var(--text)', fontFamily: 'var(--serif)', letterSpacing: '0.12em' }}>GOOMBA XI</div>
            <div>A fan-run, non-commercial game preservation server built on LandSandBoat.</div>
          </div>
        </div>
        <nav aria-label="Footer">
          <Link href="/blog">Blog</Link>
          <Link href="/getting-started">Getting Started</Link>
          <Link href="/rules">Rules</Link>
          <Link href="/approved-addons">Approved Addons</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/privacy">Privacy</Link>
          {socialLinks().map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="container" style={{ marginTop: 20 }}>
        All FINAL FANTASY XI content and images © 2002–{new Date().getFullYear()} SQUARE ENIX CO., LTD. FINAL FANTASY is a
        registered trademark of Square Enix Holdings Co., Ltd. Goomba XI is not affiliated with or endorsed by Square Enix.
      </div>
    </footer>
  )
}

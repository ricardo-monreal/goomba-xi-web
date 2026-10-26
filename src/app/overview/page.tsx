import Link from 'next/link'
import { FEATURES } from '@/data/features'

export const metadata = { title: 'Overview' }

export default function Overview() {
  return (
    <div className="narrow page prose">
      <div className="eyebrow">About</div>
      <h1>Overview</h1>
      <p className="lede">
        Goomba XI is a game preservation project: it keeps FINAL FANTASY XI playable as it was in late 2007, with the
        Level 75 cap, Treasures of Aht Urhgan, and an adventure you can enjoy solo or with a few friends.
      </p>

      <h2>The era</h2>
      <ul>
        <li><strong>Content:</strong> the original game, Rise of the Zilart, Chains of Promathia and Treasures of Aht Urhgan.</li>
        <li><strong>Level cap:</strong> 50 at first, raised to 75 through Maat&apos;s Limit Break quests.</li>
        <li><strong>Not here:</strong> Wings of the Goddess and later content, Abyssea, Records of Eminence, Field and Grounds of Valor manuals, home point teleports, Mog Garden.</li>
        <li><strong>Drop rates:</strong> retail. Faster experience and skill-ups are below.</li>
      </ul>

      <h2 id="features">Server features</h2>
      <p>
        Goomba XI keeps the 2007 game but trims the slowest grinds, so it is fun with a small group or on your own.
      </p>
      {FEATURES.map((f) => (
        <section key={f.title}>
          <h3>
            {f.title} <span className="feature-badge">{f.badge}</span>
          </h3>
          <ul>
            {f.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      ))}

      <h2>Era-accurate client</h2>
      <p>
        Era-accurate game data (DATs) ships with the launcher: shop lists, prices, menus and dialogue match 2007, not the
        modern retail client. They load through XIPivot, so your game files stay untouched and optional HD packs can sit on top.
      </p>

      <h2>Built on open source</h2>
      <p>
        The server runs <a href="https://github.com/LandSandBoat/server">LandSandBoat</a> with its era-accuracy modules,
        and the client uses the <a href="https://github.com/phoenixffxi/Era-DATs">Era-DATs</a> and xiloader from the{' '}
        <a href="https://github.com/phoenixffxi">Phoenix</a> project. Thank you to everyone who works on them.
      </p>

      <h2>Community first</h2>
      <p>
        Parties, linkshells and the long road to Limit Break are what this era is remembered for. Please read the{' '}
        <Link href="/rules">rules</Link> so it stays a place everyone wants to be.
      </p>
    </div>
  )
}

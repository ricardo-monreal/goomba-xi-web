import Link from 'next/link'

export const metadata = { title: 'FAQ' }

const QA: [string, React.ReactNode][] = [
  ['Is Goomba XI free?', 'Yes. There is no subscription and nothing to buy. The server is run by volunteers.'],
  ['Do I need a retail FINAL FANTASY XI account or install?', <>No. The launcher downloads and sets up everything. See <Link href="/getting-started">Getting Started</Link>.</>],
  ['Can I play on Linux or a Steam Deck?', <>Yes. The launcher runs natively on Linux and uses Proton automatically. See <Link href="/getting-started#linux">the Linux section</Link>.</>],
  ['Which expansions are available?', 'The original game, Rise of the Zilart, Chains of Promathia and Treasures of Aht Urhgan, at the Level 75 cap.'],
  ['Are the experience rates boosted?', <>Yes: double experience, larger combat and magic skill-ups, and double the chance of crafting and fishing skill-ups. Drop rates are retail. See <Link href="/overview#features">Server features</Link>.</>],
  ['Can I play solo?', <>Yes. You can call up to five trusts at once: five are known from your first login, and the Trust Liaison in Lower Jeuno teaches 102 more for conquest points. See <Link href="/overview#features">Server features</Link>.</>],
  ['Can I use Windower?', 'The launcher uses Ashita. Rulings on the approved list apply to both, but the launcher only supports Ashita.'],
  ['Which addons are allowed?', <>Only those on the <Link href="/approved-addons">approved list</Link>. Ask staff before using anything else.</>],
  ['How many characters can I play at once?', <>Up to two at the same time. See the <Link href="/rules">rules</Link>.</>],
  ['I forgot my password.', <>Use <Link href="/forgot-password">Forgot password</Link> to get a reset link at the e-mail address on your account.</>],
  ['How do I hide my character from the website?', 'Log in, open your character page and use the Settings tab. You can hide the whole profile, your jobs, or your online status.']
]

export default function Faq() {
  return (
    <div className="narrow page prose">
      <div className="eyebrow">About</div>
      <h1>Frequently Asked Questions</h1>
      {QA.map(([q, a]) => (
        <section key={q}>
          <h3>{q}</h3>
          <p>{a}</p>
        </section>
      ))}
    </div>
  )
}

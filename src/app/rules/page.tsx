import Link from 'next/link'

export const metadata = { title: 'Rules' }

export default function Rules() {
  return (
    <div className="narrow page prose">
      <div className="eyebrow">About</div>
      <h1>Rules and Code of Conduct</h1>
      <p className="lede">
        By playing on Goomba XI you agree to these rules. Staff may act on behaviour that breaks their spirit even when it
        isn&apos;t spelled out here.
      </p>

      <h2>1. Respect</h2>
      <ul>
        <li>No harassment, hate speech, threats or targeted abuse, in game, on Discord or anywhere else in the community.</li>
        <li>Keep /shout and /yell for their purpose: parties, trades, events. No spam.</li>
        <li>Character and linkshell names must not be offensive or impersonate staff or other players.</li>
      </ul>

      <h2>2. Fair play</h2>
      <ul>
        <li>Only tools on the <Link href="/approved-addons">approved addon list</Link> may be used, and only as approved.</li>
        <li>No bots, scripts or automation that play the game for you, including follow-and-assist chains and unattended farming.</li>
        <li>No speed, position, claim or packet manipulation of any kind.</li>
        <li>Found a bug or exploit? Report it to staff. Using it, or sharing it with others, is not allowed.</li>
      </ul>

      <h2>3. Accounts and characters</h2>
      <ul>
        <li>Each person may run at most two characters at the same time, and you must actively play both.</li>
        <li>Don&apos;t share accounts or passwords. You are responsible for everything done on your account.</li>
        <li>Buying, selling or trading gil, items, characters or services for real money or other games&apos; currency is forbidden.</li>
      </ul>

      <h2>4. Staff</h2>
      <ul>
        <li>Staff decisions are final in the moment. If you disagree, contact the team privately and calmly afterwards.</li>
        <li>Staff never ask for your password.</li>
      </ul>

      <h2>Enforcement</h2>
      <p>
        Depending on what happened: a warning, a jail period, removal of items or gil, a temporary suspension, or a permanent
        ban. Serious or repeated offences skip straight to the end of that list.
      </p>
    </div>
  )
}

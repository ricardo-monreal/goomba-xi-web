export const metadata = { title: 'Privacy Policy' }

export default function Privacy() {
  return (
    <div className="narrow page prose">
      <h1>Privacy Policy</h1>
      <p>Goomba XI stores only what it needs to run the game and this website.</p>
      <h2>What we store</h2>
      <ul>
        <li><strong>Your account:</strong> username, e-mail address and a one-way hash of your password (never the password itself).</li>
        <li><strong>Game data:</strong> your characters and everything about them, as the game server keeps it.</li>
        <li><strong>Sign-ins:</strong> a session cookie and the IP address and browser of each signed-in device, so you can stay signed in and we can stop password guessing.</li>
        <li><strong>Chat:</strong> /yell and /shout messages, which are public anyway and shown on the Yells page. Tells, party and linkshell chat are not recorded by the website.</li>
      </ul>
      <h2>What we show</h2>
      <p>
        Character pages show names, race, nation, jobs, crafts, fame and equipped gear. You can hide your profile, your jobs
        or your online status from your character&apos;s Settings tab. Inventories, auctions, delivery box and bazaar details
        are only visible to you.
      </p>
      <h2>What we don&apos;t do</h2>
      <p>No advertising, no tracking cookies, and we never sell or share your data.</p>
      <h2>Deleting your account</h2>
      <p>Contact the staff on Discord from the e-mail address on your account and we will delete it.</p>
    </div>
  )
}

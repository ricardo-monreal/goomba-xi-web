import Link from 'next/link'
import { downloads } from '@/lib/site'

export const metadata = { title: 'Getting Started' }

export default function GettingStarted() {
  const dl = downloads()
  return (
    <div className="narrow page prose">
      <div className="eyebrow">About</div>
      <h1>Getting Started</h1>
      <p className="lede">
        Everything you need is in the Goomba XI launcher: it downloads the game, keeps it up to date, and signs you in. You
        don&apos;t need a PlayOnline account or a retail install.
      </p>

      <h2>1. Create your account</h2>
      <p>
        <Link href="/register">Register here</Link>. Your username and password are the same ones you use in the launcher.
        Pick a password you don&apos;t use anywhere else.
      </p>

      <h2 id="windows">2. Windows</h2>
      <ol>
        <li>
          Download the launcher:{' '}
          {dl.windows ? <a href={dl.windows}>GoombaXI-Setup.exe</a> : <em>the download link will appear here once it is published</em>}.
        </li>
        <li>Run the installer, open <strong>Goomba XI</strong>, and press <strong>Install</strong>. The full game is about 15 GB.</li>
        <li>Sign in with your account and press <strong>Play</strong>. Windows asks for permission the first time; choose <strong>Yes</strong>.</li>
      </ol>
      <p>
        If the game doesn&apos;t start, install the{' '}
        <a href="https://aka.ms/vs/17/release/vc_redist.x86.exe">Microsoft Visual C++ x86 runtime</a> and try again. The
        launcher tells you when it is missing.
      </p>

      <h2 id="linux">3. Linux and Steam Deck</h2>
      <ol>
        <li>
          Download {dl.linux ? <a href={dl.linux}>GoombaXI.AppImage</a> : <em>the AppImage (link appears once it is published)</em>}.
        </li>
        <li>
          Make it executable (right-click → Properties → <em>Allow executing</em>, or <code>chmod +x GoombaXI.AppImage</code>) and run it.
        </li>
        <li>
          Press <strong>Install</strong>, then <strong>Play</strong>. The first launch downloads the recommended Proton build
          (GE-Proton) and prepares a Wine prefix for the game; this takes a few minutes once.
        </li>
      </ol>
      <p>
        <strong>Steam Deck:</strong> do the steps above in Desktop Mode, then use <em>Settings → Misc → Add to Steam Library</em> in
        the launcher. Restart Steam (or switch back to Game Mode) and Goomba XI appears in your library. A controller layout is
        set up by default; change it in <em>Settings → Controller</em>.
      </p>
      <p>
        Prefer your own Proton or Wine? Pick it in <em>Settings → Linux</em>. If something breaks, <em>Recreate Linux
        environment</em> on the same page starts the prefix over without touching your game files.
      </p>

      <h2>4. Your first steps</h2>
      <ul>
        <li>Read the <Link href="/rules">rules</Link> and check which <Link href="/approved-addons">addons</Link> you may use.</li>
        <li>Turn on optional HD textures and maps under <em>Addons → Pivot</em> in the launcher.</li>
        <li>Look yourself up on the <Link href="/characters">Characters</Link> page, and find a <Link href="/linkshells">linkshell</Link>.</li>
      </ul>
    </div>
  )
}

import addons from '@/data/approved-addons.json'
import AddonList from './AddonList'

export const metadata = { title: 'Approved Addons' }

const PRINCIPLES: [string, string][] = [
  ['Behaviour, not names', 'A tool that does what a forbidden tool does is forbidden too, whatever it is called.'],
  ['Approved for a purpose', 'An approved addon may only be used for what it was approved for. It may never let you do something the game itself would not, such as using fill mode or wireframe to act through walls.'],
  ['Same macro limits', 'An addon may not run a macro longer than the game allows: six lines.'],
  ['Ashita and Windower alike', 'A ruling on one launcher applies to the other. Where two tools share a name, check which program the ruling is for.'],
  ['Changed code is a new tool', 'Editing an approved addon makes an unreviewed version. Use only released versions unless staff approve your change.'],
  ['Conditions are part of the approval', 'Some tools are approved only with a feature turned off. Using that feature breaks the rules.']
]

export default function ApprovedAddons() {
  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <div className="eyebrow">About</div>
          <h1>Approved Addons</h1>
          <p className="lede">The allowlist of addons, plugins and tools for Goomba XI. If a tool isn&apos;t listed here, it may not be used.</p>
        </div>
      </div>

      <div className="cards" style={{ marginBottom: 32 }}>
        {PRINCIPLES.map(([t, d]) => (
          <div key={t} className="card">
            <h3 style={{ fontSize: 16 }}>{t}</h3>
            <p className="muted small" style={{ margin: 0 }}>
              {d}
            </p>
          </div>
        ))}
      </div>

      <AddonList addons={addons} />

      <div className="grid-2" style={{ marginTop: 40 }}>
        <div className="panel panel-pad">
          <h2>Asking for a ruling</h2>
          <p className="muted">
            Unlisted tools may not be used while they are being reviewed. To ask for one, contact the staff on Discord with a
            link to its public source code and a short description of what it does. Game Masters review requests; the
            administrators make the final call.
          </p>
        </div>
        <div className="panel panel-pad">
          <h2>The Goomba XI launcher</h2>
          <p className="muted">
            The launcher installs a small set of common addons and offers more from this list under <em>Addons</em>. Being
            approved and being shipped in the launcher are separate decisions; addon authors maintain their own work.
          </p>
        </div>
      </div>
    </div>
  )
}

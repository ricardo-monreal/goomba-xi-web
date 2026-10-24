import { redirect } from 'next/navigation'
import CharacterCard from '@/components/CharacterCard'
import JsonForm from '@/components/JsonForm'
import { currentAccount } from '@/lib/auth'
import { charactersForAccount } from '@/lib/game'
import { downloads } from '@/lib/site'

export const metadata = { title: 'My account' }

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const account = await currentAccount()
  if (!account) redirect('/login?next=/account')
  const { welcome } = await searchParams
  const chars = await charactersForAccount(account.id)
  const dl = downloads()
  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Account</div>
          <h1>{account.login}</h1>
        </div>
      </div>

      {welcome && (
        <div className="notice good" style={{ marginBottom: 24 }}>
          Welcome to Goomba XI! Download the launcher, sign in with <strong>{account.login}</strong> and create your first character.
        </div>
      )}

      <div className="grid-2">
        <section className="stack">
          <h2>Characters</h2>
          {chars.length === 0 ? (
            <div className="panel panel-pad muted">
              No characters yet. Create one in the game: open the launcher, sign in and press Play.
            </div>
          ) : (
            chars.map((c) => <CharacterCard key={c.charid} c={c} rank={c.rank} />)
          )}

          <h2 style={{ marginTop: 24 }}>Launcher</h2>
          <div className="panel panel-pad row">
            {dl.windows && (
              <a className="btn btn-primary" href={dl.windows}>
                Windows
              </a>
            )}
            {dl.linux && (
              <a className="btn" href={dl.linux}>
                Linux AppImage
              </a>
            )}
            <a className="btn btn-ghost" href="/getting-started">
              Install help
            </a>
          </div>
        </section>

        <section className="stack">
          <h2>Change password</h2>
          <div className="panel panel-pad">
            <JsonForm
              endpoint="/api/account/password"
              submit="Change password"
              success="Password changed. Other devices and launchers have been signed out."
              reset
              fields={[
                { name: 'current', label: 'Current password', type: 'password', autoComplete: 'current-password', maxLength: 32 },
                { name: 'password', label: 'New password', type: 'password', autoComplete: 'new-password', maxLength: 32, hint: '8 to 32 characters.' },
                { name: 'confirm', label: 'Repeat new password', type: 'password', autoComplete: 'new-password', maxLength: 32 }
              ]}
            />
          </div>

          <h2 style={{ marginTop: 24 }}>E-mail address</h2>
          <div className="panel panel-pad">
            <p className="muted small">Currently: {account.email || 'none'}</p>
            <JsonForm
              endpoint="/api/account/email"
              submit="Change e-mail"
              success="E-mail address updated."
              reset
              fields={[
                { name: 'email', label: 'New e-mail', type: 'email', autoComplete: 'email', maxLength: 64 },
                { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password', maxLength: 32 }
              ]}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import JsonForm from '@/components/JsonForm'
import { currentAccount } from '@/lib/auth'

export const metadata = { title: 'Register' }

export default async function Register() {
  if (await currentAccount()) redirect('/account')
  return (
    <div className="auth">
      <div className="panel panel-pad stack">
        <h1>Create your account</h1>
        <p className="muted small" style={{ textAlign: 'center' }}>
          One account holds all your characters. You&apos;ll use it on this website and in the launcher.
        </p>
        <JsonForm
          endpoint="/api/register"
          submit="Create account"
          redirect="/account?welcome=1"
          fields={[
            { name: 'username', label: 'Username', autoComplete: 'username', maxLength: 16, hint: '3 to 16 letters or digits. This is your login, not your character name.' },
            { name: 'email', label: 'E-mail', type: 'email', autoComplete: 'email', maxLength: 64, hint: 'Only used to reset your password.' },
            { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', maxLength: 32, hint: '8 to 32 characters.' },
            { name: 'confirm', label: 'Repeat password', type: 'password', autoComplete: 'new-password', maxLength: 32 },
            { name: 'agree', label: 'I have read and agree to the Rules and Code of Conduct.', type: 'checkbox' }
          ]}
        />
        <p className="small muted">
          Read the <Link href="/rules">rules</Link> first. Already have an account? <Link href="/login">Log in</Link>.
        </p>
      </div>
    </div>
  )
}

import JsonForm from '@/components/JsonForm'

export const metadata = { title: 'Forgot password' }

export default function ForgotPassword() {
  return (
    <div className="auth">
      <div className="panel panel-pad stack">
        <h1>Forgot password</h1>
        <p className="muted small">Enter the e-mail address on your account and we&apos;ll send you a link to choose a new password.</p>
        <JsonForm
          endpoint="/api/auth/forgot"
          submit="Send reset link"
          success="If that address belongs to an account, a reset link is on its way. It works for one hour."
          fields={[{ name: 'email', label: 'E-mail', type: 'email', autoComplete: 'email', maxLength: 64 }]}
        />
      </div>
    </div>
  )
}

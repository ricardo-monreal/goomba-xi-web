import JsonForm from '@/components/JsonForm'

export const metadata = { title: 'Choose a new password' }

export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams
  return (
    <div className="auth">
      <div className="panel panel-pad stack">
        <h1>New password</h1>
        <JsonForm
          endpoint="/api/auth/reset"
          submit="Save new password"
          redirect="/login"
          fields={[
            { name: 'token', label: '', type: 'hidden', value: token },
            { name: 'password', label: 'New password', type: 'password', autoComplete: 'new-password', maxLength: 32, hint: '8 to 32 characters. This also signs out every device.' },
            { name: 'confirm', label: 'Repeat new password', type: 'password', autoComplete: 'new-password', maxLength: 32 }
          ]}
        />
      </div>
    </div>
  )
}

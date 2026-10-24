import Link from 'next/link'
import { redirect } from 'next/navigation'
import BrandMark from '@/components/BrandMark'
import JsonForm from '@/components/JsonForm'
import { currentAccount } from '@/lib/auth'

export const metadata = { title: 'Log in' }

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const target = next && /^\/[A-Za-z0-9/_?=&-]*$/.test(next) ? next : '/account'
  if (await currentAccount()) redirect(target)
  return (
    <div className="auth">
      <div className="panel panel-pad stack">
        <BrandMark className="brand-mark" />
        <h1>Log in</h1>
        <JsonForm
          endpoint="/api/auth/login"
          submit="Log in"
          redirect={target}
          fields={[
            { name: 'username', label: 'Username', autoComplete: 'username', maxLength: 16 },
            { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password', maxLength: 32 }
          ]}
        />
        <div className="row small" style={{ justifyContent: 'space-between' }}>
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href="/register">Create an account</Link>
        </div>
      </div>
    </div>
  )
}

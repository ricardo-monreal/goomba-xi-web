import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="narrow page" style={{ textAlign: 'center' }}>
      <h1>Lost in the mist</h1>
      <p className="muted">That page doesn&apos;t exist, or the adventurer you&apos;re looking for has moved on.</p>
      <Link className="btn" href="/">
        Back to town
      </Link>
    </div>
  )
}

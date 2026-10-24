import YellFeed from './YellFeed'

export const metadata = { title: 'Yells' }

export default function Yells() {
  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>Yells</h1>
          <p className="lede">Keep an eye on parties, events, trades and chatter from across Vana&apos;diel.</p>
        </div>
      </div>
      <YellFeed />
    </div>
  )
}

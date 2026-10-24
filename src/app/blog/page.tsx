import Link from 'next/link'
import { allPosts, formatDate } from '@/lib/blog'

export const metadata = { title: 'Blog' }

export default function Blog() {
  const posts = allPosts()
  return (
    <div className="narrow page">
      <div className="page-head">
        <h1>Blog</h1>
      </div>
      <div className="panel list">
        {posts.length === 0 && <p className="panel-body muted">No posts yet.</p>}
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="list-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span className="tiny muted">{formatDate(p.date)}</span>
            <span className="name" style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>
              {p.title}
            </span>
            {p.summary && <span className="sub">{p.summary}</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate, getPost } from '@/lib/blog'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug)
  return { title: post?.title ?? 'Not found' }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug)
  if (!post) notFound()
  return (
    <article className="narrow page">
      <Link href="/blog" className="small">
        ← All posts
      </Link>
      <div className="tiny muted" style={{ marginTop: 20 }}>
        {formatDate(post.date)}
      </div>
      <h1>{post.title}</h1>
      {/* Posts are Markdown files from this repository, written by the staff. */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  )
}

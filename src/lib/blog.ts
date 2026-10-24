import 'server-only'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { marked } from 'marked'

// Blog posts are Markdown files in content/blog, named <slug>.md, starting with:
//
//   ---
//   title: Goomba XI is live!
//   date: 2026-10-22
//   summary: One line shown on the home page and the blog list.
//   ---

export interface Post {
  slug: string
  title: string
  date: string
  summary: string
  html: string
}

const DIR = join(process.cwd(), 'content', 'blog')

function parse(slug: string, raw: string): Post {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw.replace(/\r\n/g, '\n'))
  const meta: Record<string, string> = {}
  let body = raw
  if (m) {
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':')
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    }
    body = m[2]
  }
  return {
    slug,
    title: meta.title ?? slug,
    date: meta.date ?? '',
    summary: meta.summary ?? '',
    html: marked.parse(body, { async: false }) as string
  }
}

export function allPosts(): Post[] {
  let files: string[] = []
  try {
    files = readdirSync(DIR).filter((f) => /^[a-z0-9-]+\.md$/.test(f))
  } catch {
    return []
  }
  return files
    .map((f) => parse(f.slice(0, -3), readFileSync(join(DIR, f), 'utf8')))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPost(slug: string): Post | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  try {
    return parse(slug, readFileSync(join(DIR, `${slug}.md`), 'utf8'))
  } catch {
    return null
  }
}

export const formatDate = (d: string): string =>
  d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

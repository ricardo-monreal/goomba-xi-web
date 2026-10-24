import type { Metadata, Viewport } from 'next'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Goomba XI | A Classic FFXI Private Server', template: '%s | Goomba XI' },
  description: 'Goomba XI is a Level 75 era FINAL FANTASY XI private server. Explore characters, join the community, and relive the classic FFXI experience.',
  icons: { icon: '/icon.svg' }
}

export const viewport: Viewport = { themeColor: '#0c0e1a' }

// Every page shows live data (players online, the signed-in account).
export const dynamic = 'force-dynamic'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}

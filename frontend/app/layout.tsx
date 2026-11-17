import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import MotionProvider from '@/components/MotionProvider'
import { SITE_URL } from '@/lib/site'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const title = 'Creator Nexus — Influencer Budget Allocator'
const description =
  'Find the perfect mix of micro and nano-influencers for your D2C brand budget.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Creator Nexus',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title, description },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <MotionProvider>
          <AuthProvider>{children}</AuthProvider>
        </MotionProvider>
      </body>
    </html>
  )
}

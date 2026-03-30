import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Yawp — Sound your barbaric yawp',
  description: 'A text-first, algorithm-free social network built for humans.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

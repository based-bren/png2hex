import './globals.css'
import type { Metadata } from 'next'
import { Press_Start_2P } from 'next/font/google'

const mario = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Super PNG to Code Converter',
  description: 'Convert PNG files to code with a Super Mario-inspired theme',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={mario.className}>{children}</body>
    </html>
  )
}


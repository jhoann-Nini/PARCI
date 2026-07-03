import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Parci — Universidad del Valle, sede Tuluá',
  description:
    'El banco de parciales de tu sede. Encuentra y sube exámenes anteriores organizados por carrera, materia y profesor.',
  keywords: ['parciales', 'univalle', 'tuluá', 'exámenes', 'universidad del valle'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  )
}

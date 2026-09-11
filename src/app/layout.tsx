import type { Metadata } from 'next'
import { Geist, Geist_Mono, Fraunces } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], weight: ['600', '700'] })

export const metadata: Metadata = {
  title: 'Parci — Universidad del Valle, sede Tuluá',
  description:
    'Banco de Parciales. Encuentra y sube exámenes anteriores organizados por carrera y materia.',
  keywords: ['parciales', 'univalle', 'tuluá', 'exámenes', 'universidad del valle'],
  verification: {
    google: '-eZBvRQrIpS34-T9hN5W7lGhAXK3XkP2RHYbQx93UQk',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  )
}

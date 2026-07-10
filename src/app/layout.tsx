import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Montserrat, Lora } from 'next/font/google'
import { BRAND } from '@/config/brand'
import { StructuredData } from '@/components/ui/StructuredData'
import { PublicShell }    from '@/components/layout/PublicShell'
import '@/app/globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-lora',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: {
    default:  'Alison Estevam Studio | Barbearia em Salto/SP',
    template: `%s · ${BRAND.name}`,
  },
  description: 'Atendimento exclusivo em barbearia, corte, barba, cuidados masculinos e horário reservado em Salto/SP.',
  keywords: ['barbearia', 'barbeiro', 'corte de cabelo', 'barba', 'cuidados masculinos', 'Salto SP', 'Alison Estevam'],
  authors:  [{ name: BRAND.name }],
  creator:  BRAND.name,
  openGraph: {
    type:        'website',
    locale:      'pt_BR',
    url:         BRAND.siteUrl,
    siteName:    BRAND.fullName,
    title:       'Alison Estevam Studio | Barbearia em Salto/SP',
    description: 'Atendimento exclusivo em barbearia, corte, barba, cuidados masculinos e horário reservado em Salto/SP.',
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width:       'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor:  '#2E2E2B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${montserrat.variable} ${lora.variable}`}
    >
      <head>
        <StructuredData />
      </head>
      <body>
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  )
}

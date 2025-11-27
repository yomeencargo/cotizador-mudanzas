import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Yo me Encargo - Transporte y Mudanzas en Santiago y Todo Chile',
  description: 'Servicio profesional de mudanzas, fletes y transporte en la Región Metropolitana y todo Chile. Cotización online instantánea, precios transparentes y atención personalizada. ¡Contáctanos!',
  keywords: 'mudanzas Santiago, fletes Chile, transporte región metropolitana, mudanzas oficina, mudanzas hogar, traslado regiones, cotizador mudanzas, fletes Santiago, transporte carga Chile, mudanzas profesionales',
  authors: [{ name: 'Yo me Encargo' }],
  creator: 'Yo me Encargo',
  publisher: 'Yo me Encargo',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://yomeencargo.cl',
    title: 'Yo me Encargo - Transporte y Mudanzas Confiables en Chile',
    description: 'Mudanzas y fletes profesionales en Santiago y todo Chile. Cotiza online al instante. Servicio puntual, seguro y con los mejores precios.',
    siteName: 'Yo me Encargo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yo me Encargo - Transporte y Mudanzas en Chile',
    description: 'Mudanzas y fletes profesionales en Santiago y todo Chile. Cotiza online al instante.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}


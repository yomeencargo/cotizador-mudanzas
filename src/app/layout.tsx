import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://yomeencargo.cl'),
  title: {
    default: 'Yo me Encargo - Transporte y Mudanzas en Santiago y Todo Chile',
    template: '%s | Yo me Encargo'
  },
  description: 'Servicio profesional de mudanzas, fletes y transporte en la Región Metropolitana y todo Chile. Cotización online instantánea, precios transparentes y atención personalizada. ¡Contáctanos!',
  keywords: ['mudanzas Santiago', 'fletes Chile', 'transporte región metropolitana', 'mudanzas oficina', 'mudanzas hogar', 'traslado regiones', 'cotizador mudanzas', 'fletes Santiago', 'transporte carga Chile', 'mudanzas profesionales', 'mudanzas económicas', 'servicio de mudanzas'],
  authors: [{ name: 'Yo me Encargo', url: 'https://yomeencargo.cl' }],
  creator: 'Yo me Encargo',
  publisher: 'Yo me Encargo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://yomeencargo.cl',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://yomeencargo.cl',
    title: 'Yo me Encargo - Transporte y Mudanzas Confiables en Chile',
    description: 'Mudanzas y fletes profesionales en Santiago y todo Chile. Cotiza online al instante. Servicio puntual, seguro y con los mejores precios.',
    siteName: 'Yo me Encargo',
    images: [
      {
        url: '/images/hero-truck.jpg',
        width: 1200,
        height: 630,
        alt: 'Yo me Encargo - Mudanzas y Fletes en Chile',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yo me Encargo - Transporte y Mudanzas en Chile',
    description: 'Mudanzas y fletes profesionales en Santiago y todo Chile. Cotiza online al instante.',
    images: ['/images/hero-truck.jpg'],
  },
  verification: {
    google: '44L3bcsIFU2zQOJ7aqffCqSkWNfWiE-KlxCrL2xNdeo',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Schema.org JSON-LD para LocalBusiness
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MovingCompany',
    name: 'Yo me Encargo',
    description: 'Servicio profesional de mudanzas, fletes y transporte en Santiago y todo Chile',
    url: 'https://yomeencargo.cl',
    logo: 'https://yomeencargo.cl/images/logo.png',
    image: 'https://yomeencargo.cl/images/hero-truck.jpg',
    telephone: '+56954390267',
    priceRange: '$$',
    areaServed: {
      '@type': 'Country',
      name: 'Chile'
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Santiago',
      addressRegion: 'Región Metropolitana',
      addressCountry: 'CL'
    },
    serviceType: [
      'Mudanzas',
      'Fletes',
      'Transporte de carga',
      'Mudanzas de hogar',
      'Mudanzas de oficina',
      'Traslado a regiones'
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150'
    }
  }

  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Yo me Encargo" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}


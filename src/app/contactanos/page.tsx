import Navbar from '@/components/landing/Navbar'
import Contact from '@/components/landing/Contact'
import Footer from '@/components/landing/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contáctanos - Yo me Encargo | Transporte y Mudanzas',
  description: 'Contáctanos para tu mudanza o flete en Santiago y todo Chile. WhatsApp, teléfono y email disponibles. Respuesta rápida y atención personalizada.',
  openGraph: {
    title: 'Contáctanos - Yo me Encargo',
    description: 'Contáctanos para tu mudanza o flete. Atención rápida y personalizada.',
  },
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        <Contact />
      </main>
      <Footer />
    </>
  )
}


// Componentes de la Landing Page
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import WhyChooseUs from '@/components/landing/WhyChooseUs'
import Coverage from '@/components/landing/Coverage'
import Testimonials from '@/components/landing/Testimonials'
import FAQ from '@/components/landing/FAQ'
import Footer from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <>
      {/* Navegación principal fija */}
      <Navbar />

      {/* Contenido principal de la landing */}
      <main className="overflow-x-hidden relative isolate">
        {/* Hero principal con CTAs */}
        <Hero />

        {/* Sección: Por qué elegirnos */}
        <WhyChooseUs />

        {/* Sección: Cómo funciona el servicio */}
        <HowItWorks />

        {/* Sección: Testimonios de clientes */}
        <Testimonials />

        {/* Sección: Preguntas frecuentes */}
        <FAQ />

        {/* Sección: Cobertura geográfica */}
        <Coverage />
      </main>

      {/* Footer con enlaces y datos de contacto */}
      <Footer />
    </>
  )
}

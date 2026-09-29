import { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

// Políticas de garantía, devoluciones y reclamos.
//
// OJO: se publicaron el 30-sep-2026 armadas SOLO con lo que ya decían los Términos y
// Condiciones (seguro, exclusiones, plazo de reclamo, cancelaciones y reembolsos): no se
// agregó ninguna condición nueva. Tomás quedó en mandar el texto definitivo; cuando
// llegue, se reemplaza el contenido y se mantiene esta ruta, que es la que va enlazada en
// el pie del sitio, en el resumen del cotizador y en los correos.

export const metadata: Metadata = {
  title: 'Políticas de Garantía | Yo me Encargo',
  description:
    'Qué cubre el seguro de tu mudanza o flete con Yo me Encargo, cómo hacer un reclamo y cómo funcionan las cancelaciones y devoluciones.',
  alternates: {
    canonical: 'https://yomeencargo.cl/politicas-de-garantia',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function WarrantyPage() {
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="pt-32 pb-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center">
              Políticas de Garantía
            </h1>
            <p className="mt-4 text-center text-gray-600">
              Seguro, reclamos, cancelaciones y devoluciones
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 pb-12 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Seguro incluido en el servicio</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Todos nuestros servicios incluyen un seguro básico de transporte que cubre daños ocasionados
                  por negligencia comprobable de nuestra parte durante el traslado. La cobertura básica tiene
                  los siguientes límites:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Máximo $500.000 CLP por servicio para objetos comunes</li>
                  <li>Se requiere declaración previa para objetos de alto valor</li>
                  <li>Seguro extendido disponible por cobro adicional</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Qué no cubre</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Daños preexistentes no informados</li>
                  <li>Objetos mal embalados por el cliente</li>
                  <li>Daños causados por fuerza mayor (terremotos, inundaciones, etc.)</li>
                  <li>Artículos no declarados o declarados incorrectamente</li>
                  <li>Pérdidas por causas ajenas a nuestra operación directa</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cómo hacer un reclamo</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Cualquier reclamo debe presentarse <strong>por escrito dentro de las 48 horas posteriores al
                  servicio</strong>, acompañado de evidencia fotográfica y una descripción detallada. Puede
                  enviarlo por cualquiera de estos canales:
                </p>
                <ul className="list-none text-gray-700 space-y-2">
                  <li><strong>Email:</strong> contacto@yomeencargo.cl</li>
                  <li><strong>WhatsApp:</strong> +56 9 5233 4799</li>
                  <li><strong>Horario:</strong> Lunes a Domingo, 9:00 - 19:00 hrs</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cancelaciones y devoluciones</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Si cancela el cliente</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                  <li>Con más de 48 horas de anticipación: sin cargo</li>
                  <li>Entre 24 y 48 horas antes: 30% del valor del servicio</li>
                  <li>Con menos de 24 horas: 50% del valor del servicio</li>
                  <li>Si no se presenta el día acordado: 100% del valor del servicio</li>
                </ul>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Si cancelamos nosotros</h3>
                <p className="text-gray-700 leading-relaxed">
                  Si debemos cancelar o reprogramar por causas de fuerza mayor, se notificará al cliente con la
                  mayor anticipación posible y se ofrecerá <strong>reprogramación sin costo o reembolso
                  completo</strong>.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Resolución de conflictos</h2>
                <p className="text-gray-700 leading-relaxed">
                  Cualquier disputa relacionada con nuestros servicios será resuelta inicialmente mediante
                  comunicación directa entre las partes. Si no se llega a un acuerdo, las partes se someterán a
                  la jurisdicción de los tribunales de Santiago, Chile.
                </p>
              </section>

              <div className="mt-12 p-6 bg-blue-50 rounded-lg border-l-4 border-brand-blue">
                <p className="text-gray-700">
                  Estas políticas forman parte de nuestros{' '}
                  <Link href="/terminos-y-condiciones" className="font-semibold text-primary-600 hover:underline">
                    Términos y Condiciones
                  </Link>
                  , donde están las condiciones completas del servicio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}

import { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

// Políticas de garantía, devoluciones y reclamos.
//
// Texto de Tomás («Servicios, Términos y Garantías», recibido el 30-sep-2026): las
// secciones de garantía van LITERALES, sin reescribirlas. Cancelaciones y devoluciones
// siguen saliendo de los Términos y Condiciones, que el documento de Tomás no cubre.
// Esta ruta es la que va enlazada en el pie del sitio, en el resumen del cotizador y
// en el pie de todos los correos: si cambia el texto, se cambia acá y listo.

export const metadata: Metadata = {
  title: 'Políticas de Garantía | Yo me Encargo',
  description:
    'Alcance de la garantía de Yo me Encargo, responsabilidad por daños, cómo informar un daño, artículos de alto valor y cancelaciones y devoluciones.',
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
              Yo Me Encargo SpA · RUT 77.437.426-4
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 pb-12 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Alcance de la garantía</h2>
                <p className="text-gray-700 leading-relaxed">
                  La garantía de Yo Me Encargo por daños en los artículos trasladados aplica únicamente cuando el
                  servicio contratado incluye embalaje realizado por nuestro equipo. Si el cliente contrata el
                  traslado sin este servicio, Yo Me Encargo no otorga garantía sobre los bienes embalados por el
                  propio cliente o por terceros.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Responsabilidad por daños</h2>
                <p className="text-gray-700 leading-relaxed">
                  Yo Me Encargo se responsabiliza por los daños o deterioros que sufran los bienes trasladados por
                  su culpa, hasta un máximo del 30% del valor neto de la mudanza. El cliente será responsable de
                  cualquier diferencia de precio que supere dicho monto, y en caso de solicitar compensación o
                  restauración deberá pagar previamente un deducible de 2 UF. Yo Me Encargo no se hace responsable
                  en ningún caso por daños o pérdidas de objetos o cajas embaladas por el cliente o por un tercero,
                  así como tampoco por daños causados por caso fortuito, fuerza mayor o mal estado previo de los
                  bienes a trasladar.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cómo informar un daño</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Cualquier daño debe ser informado <strong>por escrito, vía correo electrónico, dentro de los 5
                  días posteriores al servicio</strong>.
                </p>
                <ul className="list-none text-gray-700 space-y-2">
                  <li><strong>Correo:</strong> contacto@yomeencargo.cl</li>
                  <li><strong>Reclamos y sugerencias:</strong> +56 9 5439 0267</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Traslado de joyas y artículos de alto valor</h2>
                <p className="text-gray-700 leading-relaxed">
                  Es de exclusiva responsabilidad del cliente el traslado de artículos de alto valor, tales como
                  joyas, relojes, perfumes, artículos electrónicos, dinero, obras de arte, objetos personales
                  invaluables y otros. Yo Me Encargo no se hará responsable por la pérdida, daño o extravío de estos
                  artículos durante la mudanza. Todo objeto valorizado en más de 25 UF que el cliente necesite
                  trasladar debe ser declarado por correo electrónico a nuestra empresa con anticipación, con el fin
                  de tomar los resguardos necesarios para su traslado.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cancelaciones y devoluciones</h2>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Resolución de conflictos</h2>
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

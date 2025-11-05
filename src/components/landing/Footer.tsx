'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Mail, Phone, MapPin, ChevronDown } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [openSection, setOpenSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  return (
    <footer className="bg-gray-900 text-gray-300 relative isolate">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Columna 1: Logo y Descripción */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative w-12 h-12">
                <Image
                  src="/logo.png"
                  alt="Yo me Encargo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white">Yo me Encargo</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Tu aliado en transporte y mudanzas en todo Chile. Servicio confiable, puntual y profesional.
            </p>
            {/* Redes Sociales */}
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/yo.me.encargo_"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-blue transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="mailto:contacto@yomeencargo.cl"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-cyan transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
              <a
                href="https://wa.me/56954390267"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-green transition-colors"
                aria-label="WhatsApp"
              >
                <Phone size={20} />
              </a>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            {/* Header clickeable en móvil */}
            <button
              onClick={() => toggleSection('enlaces')}
              className="md:cursor-default w-full flex items-center justify-between md:justify-start text-white font-bold text-lg mb-4"
            >
              <span>Enlaces Rápidos</span>
              <ChevronDown 
                size={20} 
                className={`md:hidden transition-transform duration-300 ${
                  openSection === 'enlaces' ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {/* Lista colapsable en móvil, siempre visible en desktop */}
            <ul 
              className={`space-y-3 overflow-hidden transition-all duration-300 md:!block md:!max-h-none md:!opacity-100 ${
                openSection === 'enlaces' 
                  ? 'max-h-96 opacity-100' 
                  : 'max-h-0 opacity-0'
              }`}
            >
              <li>
                <Link
                  href="/"
                  className="hover:text-brand-blue transition-colors block"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/nuestros-servicios"
                  className="hover:text-brand-blue transition-colors block"
                >
                  Nuestros Servicios
                </Link>
              </li>
              <li>
                <Link
                  href="/contactanos"
                  className="hover:text-brand-blue transition-colors block"
                >
                  Contáctanos
                </Link>
              </li>
              <li>
                <Link
                  href="/cotizador"
                  className="hover:text-brand-blue transition-colors block"
                >
                  Cotizar Online
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Legal */}
          <div>
            {/* Header clickeable en móvil */}
            <button
              onClick={() => toggleSection('legal')}
              className="md:cursor-default w-full flex items-center justify-between md:justify-start text-white font-bold text-lg mb-4"
            >
              <span>Legal</span>
              <ChevronDown 
                size={20} 
                className={`md:hidden transition-transform duration-300 ${
                  openSection === 'legal' ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {/* Lista colapsable en móvil, siempre visible en desktop */}
            <ul 
              className={`space-y-3 overflow-hidden transition-all duration-300 md:!block md:!max-h-none md:!opacity-100 ${
                openSection === 'legal' 
                  ? 'max-h-96 opacity-100' 
                  : 'max-h-0 opacity-0'
              }`}
            >
              <li>
                <Link href="/terminos-y-condiciones" className="hover:text-brand-blue transition-colors block">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/politica-de-privacidad" className="hover:text-brand-blue transition-colors block">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            {/* Header clickeable en móvil */}
            <button
              onClick={() => toggleSection('contacto')}
              className="md:cursor-default w-full flex items-center justify-between md:justify-start text-white font-bold text-lg mb-4"
            >
              <span>Contacto</span>
              <ChevronDown 
                size={20} 
                className={`md:hidden transition-transform duration-300 ${
                  openSection === 'contacto' ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {/* Lista colapsable en móvil, siempre visible en desktop */}
            <ul 
              className={`space-y-4 overflow-hidden transition-all duration-300 md:!block md:!max-h-none md:!opacity-100 ${
                openSection === 'contacto' 
                  ? 'max-h-96 opacity-100' 
                  : 'max-h-0 opacity-0'
              }`}
            >
              <li className="flex items-start space-x-3">
                <Phone size={20} className="text-brand-blue flex-shrink-0 mt-0.5" />
                <div>
                  <a href="tel:+56954390267" className="hover:text-brand-blue transition-colors">
                    +56 9 5439 0267
                  </a>
                  <p className="text-sm text-gray-500">Lun - Dom: 9:00 - 19:00</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Mail size={20} className="text-brand-cyan flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:contacto@yomeencargo.cl"
                  className="hover:text-brand-cyan transition-colors break-all"
                >
                  contacto@yomeencargo.cl
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin size={20} className="text-brand-green flex-shrink-0 mt-0.5" />
                <div>
                  <p>Región Metropolitana</p>
                  <p className="text-sm text-gray-500">Santiago, Chile</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center space-y-3">
            {/* Primera línea: Copyright */}
            <p className="text-sm text-gray-500 text-center">
              © {currentYear} Yo me Encargo. Todos los derechos reservados.
            </p>
            
            {/* Segunda línea: Enlaces legales */}
            <div className="flex items-center space-x-4 text-sm">
              <Link href="/terminos-y-condiciones" className="text-gray-500 hover:text-brand-blue transition-colors">
                Términos y Condiciones
              </Link>
              <span className="text-gray-700">|</span>
              <Link href="/politica-de-privacidad" className="text-gray-500 hover:text-brand-blue transition-colors">
                Política de Privacidad
              </Link>
            </div>

            {/* Tercera línea: Créditos */}
            <p className="text-sm text-gray-500 text-center">
              Desarrollado por{' '}
              <a 
                href="https://iaenblanco.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-brand-blue hover:text-brand-cyan transition-colors font-semibold"
              >
                IAenBlanco
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}


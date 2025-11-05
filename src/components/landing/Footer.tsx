'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Mail, Phone, MapPin, Truck } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
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
            <h3 className="text-white font-bold text-lg mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection('inicio')}
                  className="hover:text-brand-blue transition-colors"
                >
                  Inicio
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('servicios')}
                  className="hover:text-brand-blue transition-colors"
                >
                  Servicios
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('como-funciona')}
                  className="hover:text-brand-blue transition-colors"
                >
                  Cómo Funciona
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('cobertura')}
                  className="hover:text-brand-blue transition-colors"
                >
                  Cobertura
                </button>
              </li>
              <li>
                <Link
                  href="/contactanos"
                  className="hover:text-brand-blue transition-colors"
                >
                  Contáctanos
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Servicios */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Servicios</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/cotizador" className="hover:text-brand-blue transition-colors">
                  Cotizador Online
                </Link>
              </li>
              <li>
                <Link href="/cotizador" className="hover:text-brand-blue transition-colors">
                  Fletes en Santiago
                </Link>
              </li>
              <li>
                <Link href="/cotizador" className="hover:text-brand-blue transition-colors">
                  Mudanzas de Hogar
                </Link>
              </li>
              <li>
                <Link href="/cotizador" className="hover:text-brand-blue transition-colors">
                  Mudanzas de Oficina
                </Link>
              </li>
              <li>
                <Link href="/cotizador" className="hover:text-brand-blue transition-colors">
                  Traslados a Regiones
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contacto</h3>
            <ul className="space-y-4">
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
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-500 text-center md:text-left">
              © {currentYear} Yo me Encargo. Todos los derechos reservados.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Truck size={16} className="text-brand-blue" />
              <span>Transporte confiable en todo Chile</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}


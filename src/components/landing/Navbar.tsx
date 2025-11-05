'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Phone } from 'lucide-react'
import Image from 'next/image'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Detectar scroll para cambiar estilo del navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Navegación suave
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsMobileMenuOpen(false)
    }
  }

  const navLinks = [
    { name: 'Inicio', id: 'inicio', href: '/' },
    { name: 'Nuestros Servicios', id: 'servicios', href: '/nuestros-servicios' },
    { name: 'Contáctanos', id: 'contacto', href: '/contactanos' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-lg py-3'
          : 'bg-white/95 backdrop-blur-sm py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-12 h-12 md:w-14 md:h-14">
              <Image
                src="/logo.png"
                alt="Yo me Encargo - Transporte y Mudanzas"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl md:text-2xl font-bold text-brand-blue">
              Yo me Encargo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              link.href ? (
                <Link
                  key={link.id}
                  href={link.href}
                  className="text-gray-700 hover:text-brand-blue transition-colors font-medium"
                >
                  {link.name}
                </Link>
              ) : (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-gray-700 hover:text-brand-blue transition-colors font-medium"
                >
                  {link.name}
                </button>
              )
            ))}
          </div>

          {/* CTAs Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <a
              href="tel:+56954390267"
              className="flex items-center space-x-2 text-brand-gray hover:text-brand-blue transition-colors"
            >
              <Phone size={18} />
              <span className="font-medium">+56 9 5439 0267</span>
            </a>
            <Link
              href="/cotizador"
              className="px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Cotizar Ahora
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-brand-blue transition-colors"
            aria-label="Menú"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 py-4 border-t border-gray-200 animate-slide-down">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                link.href ? (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-left text-gray-700 hover:text-brand-blue transition-colors font-medium py-2"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="text-left text-gray-700 hover:text-brand-blue transition-colors font-medium py-2"
                  >
                    {link.name}
                  </button>
                )
              ))}
              <a
                href="tel:+56954390267"
                className="flex items-center space-x-2 text-brand-gray hover:text-brand-blue transition-colors py-2"
              >
                <Phone size={18} />
                <span className="font-medium">+56 9 5439 0267</span>
              </a>
              <Link
                href="/cotizador"
                className="px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-colors font-semibold text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Cotizar Ahora
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}


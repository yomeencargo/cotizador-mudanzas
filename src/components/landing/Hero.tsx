'use client'

import Link from 'next/link'
import { Truck, Clock, MapPin, Shield, ArrowRight, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Hero() {
  const benefits = [
    { icon: Clock, text: 'Puntualidad garantizada' },
    { icon: MapPin, text: 'Cobertura nacional' },
    { icon: Shield, text: 'Carga protegida' },
    { icon: Truck, text: 'Flota moderna' },
  ]

  return (
    <section id="inicio" className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden isolate">
      {/* Background gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 -z-10" />
      
      {/* Patron decorativo */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ contain: 'paint' }}>
        <div className="absolute inset-0 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
          backgroundRepeat: 'repeat',
        }} />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenido Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-brand-green/10 text-brand-green px-4 py-2 rounded-full mb-6">
              <Shield size={18} />
              <span className="text-sm font-semibold">Servicio Confiable desde 2020</span>
            </div>

            {/* Título Principal */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transporte y Mudanzas{' '}
              <span className="text-brand-blue">Confiables</span>{' '}
              en todo Chile
            </h1>

            {/* Subtítulo */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
              Yo me Encargo te ayuda con <strong>fletes, mudanzas y traslados de carga</strong> en la Región Metropolitana y todo Chile. Rápido, seguro y sin complicaciones.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Link
                href="/cotizador"
                className="group px-8 py-4 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center space-x-2"
              >
                <span>Cotiza tu Traslado Online</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              
              <a
                href="https://wa.me/56954390267?text=Hola,%20necesito%20información%20sobre%20sus%20servicios"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-brand-green text-white rounded-lg hover:bg-brand-green-light transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2"
              >
                <MessageCircle size={20} />
                <span>Hablar con Asesor</span>
              </a>
            </div>

            {/* Beneficios Rápidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="flex flex-col items-center text-center p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm"
                >
                  <benefit.icon className="text-brand-cyan mb-2" size={28} />
                  <span className="text-xs md:text-sm font-medium text-gray-700">
                    {benefit.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Imagen/Ilustración */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              {/* Placeholder para la imagen del hero */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <Truck size={120} className="mx-auto mb-4 opacity-90" />
                  <p className="text-lg font-semibold opacity-80">
                    Sube tu imagen: /public/images/hero-truck.jpg
                    <br />
                    (1200x800px recomendado)
                  </p>
                </div>
              </div>
              
              {/* Cuando subas la imagen real, descomenta esto y elimina el div de arriba: */}
              {/* <Image
                src="/images/hero-truck.jpg"
                alt="Camión de Yo me Encargo realizando mudanza"
                fill
                className="object-cover"
                priority
              /> */}
            </div>

            {/* Elemento decorativo flotante */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl animate-float">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center">
                  <Shield className="text-brand-green" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">+500</p>
                  <p className="text-sm text-gray-600">Clientes Satisfechos</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


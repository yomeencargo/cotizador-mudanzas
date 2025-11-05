'use client'

import { MapPin, Truck, Package } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Coverage() {
  const regions = [
    'Región Metropolitana',
    'Valparaíso',
    'O\'Higgins',
    'Maule',
    'Biobío',
    'Araucanía',
    'Los Lagos',
    'Coquimbo',
    'Atacama',
    'Antofagasta',
    'Tarapacá',
    'Arica y Parinacota',
    'Los Ríos',
    'Aysén',
    'Magallanes',
  ]

  return (
    <section id="cobertura" className="py-20 md:py-28 bg-gradient-to-br from-blue-900 via-cyan-800 to-green-700 text-white relative overflow-hidden">
      {/* Patrón decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenido Principal */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Cobertura en Todo Chile
            </h2>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Llevamos tus pertenencias a donde las necesites, desde Arica hasta Punta Arenas
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-5 rounded-xl">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Región Metropolitana</h3>
                  <p className="text-white/80">
                    Cobertura completa en Santiago y alrededores. Servicio el mismo día disponible.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-5 rounded-xl">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Traslados a Regiones</h3>
                  <p className="text-white/80">
                    Realizamos envíos y mudanzas a todas las regiones de Chile con tracking incluido.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm p-5 rounded-xl">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Envíos Nacionales</h3>
                  <p className="text-white/80">
                    Desde pequeños paquetes hasta cargas completas. Cotiza tu envío en segundos.
                  </p>
                </div>
              </div>
            </div>

            <a
              href="/cotizador"
              className="mt-8 inline-block px-8 py-4 bg-white text-brand-blue rounded-lg hover:bg-gray-100 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Cotizar mi Traslado
            </a>
          </motion.div>

          {/* Mapa/Regiones */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl"
          >
            <h3 className="text-2xl font-bold mb-6 text-center">
              Todas las Regiones de Chile
            </h3>
            
            {/* Grid de regiones */}
            <div className="grid grid-cols-2 gap-3">
              {regions.map((region, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-white/10 p-3 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-brand-green flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">{region}</span>
                </div>
              ))}
            </div>

            {/* Placeholder para imagen de mapa */}
            <div className="mt-6 p-6 bg-white/5 rounded-xl border-2 border-dashed border-white/20 text-center">
              <MapPin size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm text-white/60">
                Sube tu mapa: /public/images/cobertura-mapa.jpg
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


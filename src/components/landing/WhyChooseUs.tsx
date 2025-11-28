'use client'

import { Shield, Clock, DollarSign, Users, MapPin, ThumbsUp, Headphones, Star } from 'lucide-react'
import { motion } from 'framer-motion'

export default function WhyChooseUs() {
  const benefits = [
    {
      icon: Clock,
      title: 'Puntualidad Garantizada',
      description: 'Cumplimos con los horarios acordados. Tu tiempo es valioso para nosotros.',
    },
    {
      icon: Shield,
      title: 'Carga Protegida',
      description: 'Todos nuestros servicios incluyen seguro básico. Tus pertenencias están seguras.',
    },
    {
      icon: DollarSign,
      title: 'Precios Transparentes',
      description: 'Sin costos ocultos. Cotización clara y detallada antes de contratar.',
    },
    {
      icon: Users,
      title: 'Equipo Profesional',
      description: 'Personal capacitado, responsable y con experiencia en mudanzas y transporte.',
    },
    {
      icon: MapPin,
      title: 'Cobertura Amplia',
      description: 'Operamos en toda la RM y realizamos traslados a cualquier región de Chile.',
    },
    {
      icon: Headphones,
      title: 'Atención Personalizada',
      description: 'Asesoría directa por WhatsApp, email o teléfono. Resolvemos tus dudas al instante.',
    },
    {
      icon: ThumbsUp,
      title: 'Flexibilidad de Horarios',
      description: 'Nos adaptamos a tu disponibilidad. Servicios de lunes a domingo.',
    },
    {
      icon: Star,
      title: 'Alta Satisfacción',
      description: 'Miles de clientes satisfechos confían en nosotros para sus traslados.',
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            ¿Por Qué Elegirnos?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Más de <strong>500 clientes</strong> confían en nosotros para sus mudanzas y traslados
          </p>
        </motion.div>

        {/* Grid de Beneficios */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 rounded-xl bg-gradient-to-br from-gray-50 to-brand-blue-light hover:from-brand-blue hover:to-brand-cyan transition-all duration-300 cursor-default border border-gray-100 hover:border-transparent hover:shadow-xl"
            >
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="text-brand-blue group-hover:text-brand-cyan" size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-white mb-2 transition-colors">
                {benefit.title}
              </h3>
              <p className="text-gray-600 group-hover:text-white/90 text-sm transition-colors">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { number: '+500', label: 'Clientes Satisfechos' },
            { number: '+1000', label: 'Mudanzas Realizadas' },
            { number: '4.9/5', label: 'Calificación Promedio' },
            { number: '100%', label: 'Compromiso' },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-gradient-to-br from-brand-blue to-brand-cyan rounded-xl shadow-lg text-white"
            >
              <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
              <div className="text-sm md:text-base text-white/90">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}


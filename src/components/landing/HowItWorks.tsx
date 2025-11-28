'use client'

import { ClipboardList, Calculator, Calendar, Truck } from 'lucide-react'
import { motion } from 'framer-motion'

export default function HowItWorks() {
  const steps = [
    {
      icon: ClipboardList,
      title: 'Cuéntanos qué necesitas',
      description: 'Completa nuestro formulario online con los detalles de tu mudanza o traslado.',
      color: 'bg-blue-500',
      delay: 0.1,
    },
    {
      icon: Calculator,
      title: 'Cotiza al instante',
      description: 'Recibe tu cotización inmediata y transparente. Sin sorpresas ni costos ocultos.',
      color: 'bg-cyan-500',
      delay: 0.2,
    },
    {
      icon: Calendar,
      title: 'Agenda tu servicio',
      description: 'Elige el día y horario que mejor te acomode. Nos adaptamos a tu disponibilidad.',
      color: 'bg-green-500',
      delay: 0.3,
    },
    {
      icon: Truck,
      title: 'Nos encargamos de todo',
      description: 'Vamos, cargamos y entregamos donde necesites. Con cuidado y puntualidad.',
      color: 'bg-indigo-500',
      delay: 0.4,
    },
  ]

  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-white">
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
            ¿Cómo Funciona?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            En solo <strong>4 pasos simples</strong> resolvemos tu mudanza o traslado
          </p>
        </motion.div>

        {/* Pasos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Línea conectora en desktop */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue-light via-brand-blue to-brand-green transform translate-y-1/2" 
               style={{ width: 'calc(100% - 12rem)', margin: '0 6rem' }} 
          />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: step.delay }}
              className="relative"
            >
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-gray-100 h-full">
                {/* Número del paso */}
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-cyan text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg z-10">
                  {index + 1}
                </div>

                {/* Icono */}
                <div className={`${step.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto lg:mx-0`}>
                  <step.icon className="text-white" size={32} />
                </div>

                {/* Contenido */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center lg:text-left">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-center lg:text-left">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <a
            href="/cotizador"
            className="inline-block px-8 py-4 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Comenzar mi Cotización
          </a>
        </motion.div>
      </div>
    </section>
  )
}


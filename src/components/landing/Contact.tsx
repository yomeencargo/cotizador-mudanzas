'use client'

import { Mail, Phone, Clock, MessageCircle, ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Contact() {
  const contactItems = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '+56 9 5439 0267',
      description: 'Respuesta inmediata',
      href: 'https://wa.me/56954390267',
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      iconBg: 'bg-gradient-to-br from-green-400 to-emerald-500',
      hoverTextColor: 'group-hover:text-green-600',
    },
    {
      icon: Phone,
      title: 'Teléfono',
      value: '+56 9 5439 0267',
      description: 'Lunes a Domingo',
      href: 'tel:+56954390267',
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      iconBg: 'bg-gradient-to-br from-blue-400 to-cyan-500',
      hoverTextColor: 'group-hover:text-blue-600',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'contacto@yomeencargo.cl',
      description: 'Respuesta en 24hrs',
      href: 'mailto:contacto@yomeencargo.cl',
      gradient: 'from-cyan-500 to-blue-600',
      bgGradient: 'from-cyan-50 to-blue-50',
      iconBg: 'bg-gradient-to-br from-cyan-400 to-blue-500',
      hoverTextColor: 'group-hover:text-cyan-600',
    },
  ]

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-light via-white to-cyan-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(111,168,220,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(140,198,63,0.08),transparent_50%)]"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-cyan rounded-2xl mb-6 shadow-lg"
          >
            <MessageCircle className="text-white" size={32} />
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Contáctanos
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Estamos listos para ayudarte con tu mudanza o traslado
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {/* Grid de Contacto */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {contactItems.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.a
                  key={item.title}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  {/* Efecto de fondo al hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  {/* Decoración de esquina */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-5 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:opacity-10 transition-opacity duration-300`}></div>

                  <div className="relative z-10">
                    {/* Icono */}
                    <div className={`${item.iconBg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="text-white" size={32} />
                    </div>

                    {/* Contenido */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                      {item.title}
                    </h3>
                    <p className={`text-lg font-semibold text-brand-blue mb-2 ${item.hoverTextColor} transition-colors`}>
                      {item.value}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.description}
                    </p>

                    {/* Flecha */}
                    <div className="mt-6 flex items-center text-brand-blue group-hover:translate-x-2 transition-transform duration-300">
                      <span className="text-sm font-semibold mr-2">Contactar</span>
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </motion.a>
              )
            })}
          </div>

          {/* Información adicional y CTA */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Horario */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Clock className="text-white" size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Horario de Atención</h3>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-800">Lunes a Domingo</p>
                    <p className="text-2xl font-bold text-brand-blue">9:00 - 18:00 hrs</p>
                    <p className="text-sm text-gray-600 mt-3 flex items-center">
                      <Sparkles size={14} className="mr-2 text-brand-green" />
                      Respondemos emails y WhatsApp
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA Cotización Rápida */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative bg-gradient-to-br from-brand-blue via-brand-cyan to-cyan-500 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            >
              {/* Efectos decorativos de fondo */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
              
              <div className="relative z-10 text-white">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
                    <Sparkles className="text-white" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold">¿Necesitas una cotización rápida?</h3>
                </div>
                <p className="text-white/90 mb-6 text-lg leading-relaxed">
                  Usa nuestro cotizador online y obtén tu presupuesto al instante, sin esperas ni complicaciones.
                </p>
                <a
                  href="/cotizador"
                  className="inline-flex items-center justify-center w-full px-6 py-4 bg-white text-brand-blue rounded-xl hover:bg-gray-50 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 group-hover:scale-105"
                >
                  <span>Ir al Cotizador</span>
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}


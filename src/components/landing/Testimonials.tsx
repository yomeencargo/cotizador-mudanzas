'use client'

import { Star, Quote } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Testimonials() {
  const testimonials = [
    {
      name: 'María González',
      service: 'Mudanza de Departamento',
      rating: 5,
      comment: 'Excelente servicio. Fueron muy cuidadosos con mis muebles y llegaron puntualmente. El equipo fue muy profesional y amable. 100% recomendados.',
      date: 'Octubre 2024',
    },
    {
      name: 'Carlos Ramírez',
      service: 'Flete a Viña del Mar',
      rating: 5,
      comment: 'Necesitaba enviar muebles urgente a Viña y cumplieron perfecto. La cotización fue clara y no hubo sorpresas. Muy contentos con el servicio.',
      date: 'Septiembre 2024',
    },
    {
      name: 'Andrea Muñoz',
      service: 'Mudanza de Oficina',
      rating: 5,
      comment: 'Coordinaron todo perfectamente para nuestra mudanza de oficina. Nos trasladamos un fin de semana y el lunes ya estábamos operando sin problemas.',
      date: 'Agosto 2024',
    },
    {
      name: 'Jorge Silva',
      service: 'Flete en Santiago',
      rating: 5,
      comment: 'Rápidos y eficientes. Solicité el servicio por la mañana y en la tarde ya tenía todo en mi nueva casa. Precios muy razonables.',
      date: 'Octubre 2024',
    },
    {
      name: 'Valentina Torres',
      service: 'Mudanza de Casa',
      rating: 5,
      comment: 'La mejor experiencia de mudanza que he tenido. El equipo fue súper cuidadoso y profesional. El cotizador online es muy práctico.',
      date: 'Septiembre 2024',
    },
    {
      name: 'Roberto Pérez',
      service: 'Transporte a Concepción',
      rating: 5,
      comment: 'Envié mercadería a Concepción y todo llegó perfecto y a tiempo. Me mantuvieron informado durante todo el proceso. Muy confiables.',
      date: 'Agosto 2024',
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-gray-50 to-blue-50">
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
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Miles de personas confían en nosotros para sus mudanzas y traslados
          </p>
        </motion.div>

        {/* Grid de Testimonios */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 relative"
            >
              {/* Icono de comillas */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-cyan rounded-full flex items-center justify-center shadow-lg">
                <Quote size={20} className="text-white" />
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={18} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Comentario */}
              <p className="text-gray-700 mb-4 leading-relaxed">
                &ldquo;{testimonial.comment}&rdquo;
              </p>

              {/* Autor */}
              <div className="pt-4 border-t border-gray-100">
                <p className="font-bold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-brand-blue">{testimonial.service}</p>
                <p className="text-xs text-gray-500 mt-1">{testimonial.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


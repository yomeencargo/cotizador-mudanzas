'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: '¿Con cuánta anticipación debo agendar mi servicio?',
      answer: 'Recomendamos agendar con al menos 24-48 horas de anticipación para garantizar disponibilidad. Sin embargo, también ofrecemos servicio el mismo día según disponibilidad, especialmente para fletes dentro de Santiago.',
    },
    {
      question: '¿Trabajan fines de semana y festivos?',
      answer: 'Sí, trabajamos de lunes a domingo. Para fines de semana y festivos, te recomendamos agendar con mayor anticipación debido a la alta demanda. El cotizador online te mostrará la disponibilidad en tiempo real.',
    },
    {
      question: '¿Realizan traslados a regiones?',
      answer: 'Sí, realizamos traslados y envíos a todas las regiones de Chile. Puedes cotizar directamente en nuestro sistema online ingresando la dirección de origen y destino. Te entregaremos un tiempo estimado de entrega y el costo total.',
    },
    {
      question: '¿Qué tipo de cosas NO trasladan?',
      answer: 'No transportamos materiales peligrosos, inflamables, explosivos, sustancias químicas, animales vivos, ni alimentos que requieran refrigeración. Para cargas especiales, contáctanos directamente para evaluar tu caso.',
    },
    {
      question: '¿Cómo funciona la cotización online?',
      answer: 'Nuestro cotizador es muy simple: ingresas origen, destino, fecha, y seleccionas los items o tipo de carga. El sistema calcula automáticamente el precio basado en distancia, volumen y servicios adicionales. Todo transparente y sin sorpresas.',
    },
    {
      question: '¿Cómo se realiza el pago?',
      answer: 'Aceptamos transferencia bancaria, efectivo y tarjetas de crédito/débito. El pago se realiza una vez confirmado el servicio. Para empresas ofrecemos facturación y crédito según evaluación.',
    },
    {
      question: '¿Incluyen embalaje y materiales?',
      answer: 'El embalaje y materiales (cajas, plástico burbuja, etc.) se pueden contratar como servicio adicional. Si prefieres, puedes embalar tú mismo y nosotros solo nos encargamos del transporte.',
    },
    {
      question: '¿Qué pasa si se daña algo durante el traslado?',
      answer: 'Todos nuestros servicios incluyen seguro básico. Manejamos tus pertenencias con el mayor cuidado, pero si ocurre algún daño, contamos con cobertura. Te recomendamos contratar seguro extendido para items de alto valor.',
    },
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-blue/10 rounded-full mb-4">
            <HelpCircle size={32} className="text-brand-blue" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-lg md:text-xl text-gray-600">
            Todo lo que necesitas saber sobre nuestros servicios
          </p>
        </motion.div>

        {/* Lista de FAQs */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  size={24}
                  className={`text-brand-blue flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


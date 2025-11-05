'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Aquí se debe integrar la lógica de envío del formulario
    // Por ahora, redirigir a WhatsApp con los datos
    const whatsappMessage = `Hola, mi nombre es ${formData.name}.%0A%0AServicio: ${formData.service}%0ATelefono: ${formData.phone}%0AEmail: ${formData.email}%0A%0AMensaje: ${formData.message}`
    window.open(`https://wa.me/56954390267?text=${whatsappMessage}`, '_blank')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

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
            Contáctanos
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Estamos listos para ayudarte con tu mudanza o traslado
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Información de Contacto */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Información de Contacto
              </h3>

              <div className="space-y-5">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/56954390267"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start space-x-4 p-4 rounded-xl hover:bg-green-50 transition-colors group"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                    <MessageCircle className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">WhatsApp</p>
                    <p className="text-brand-blue font-medium">+56 9 5439 0267</p>
                    <p className="text-sm text-gray-600">Respuesta inmediata</p>
                  </div>
                </a>

                {/* Teléfono */}
                <a
                  href="tel:+56954390267"
                  className="flex items-start space-x-4 p-4 rounded-xl hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                    <Phone className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Teléfono</p>
                    <p className="text-brand-blue font-medium">+56 9 5439 0267</p>
                    <p className="text-sm text-gray-600">Lunes a Domingo</p>
                  </div>
                </a>

                {/* Email */}
                <a
                  href="mailto:contacto@yomeencargo.cl"
                  className="flex items-start space-x-4 p-4 rounded-xl hover:bg-cyan-50 transition-colors group"
                >
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-200 transition-colors">
                    <Mail className="text-cyan-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Email</p>
                    <p className="text-brand-blue font-medium">contacto@yomeencargo.cl</p>
                    <p className="text-sm text-gray-600">Respuesta en 24hrs</p>
                  </div>
                </a>

                {/* Ubicación */}
                <div className="flex items-start space-x-4 p-4 rounded-xl">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-gray-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Ubicación</p>
                    <p className="text-gray-700">Región Metropolitana</p>
                    <p className="text-sm text-gray-600">Santiago, Chile</p>
                  </div>
                </div>

                {/* Horario */}
                <div className="flex items-start space-x-4 p-4 rounded-xl">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="text-gray-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Horario de Atención</p>
                    <p className="text-gray-700">Lunes a Domingo</p>
                    <p className="text-sm text-gray-600">9:00 - 19:00 hrs</p>
                    <p className="text-xs text-brand-blue mt-1">*Respondemos emails y WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Rápido */}
            <div className="bg-gradient-to-r from-brand-blue to-brand-cyan p-8 rounded-2xl shadow-lg text-white">
              <h3 className="text-xl font-bold mb-3">¿Necesitas una cotización rápida?</h3>
              <p className="mb-6 text-white/90">
                Usa nuestro cotizador online y obtén tu presupuesto al instante
              </p>
              <a
                href="/cotizador"
                className="inline-block w-full text-center px-6 py-3 bg-white text-brand-blue rounded-lg hover:bg-gray-100 transition-all duration-300 font-bold"
              >
                Ir al Cotizador
              </a>
            </div>
          </motion.div>

          {/* Formulario de Contacto */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white p-8 rounded-2xl shadow-lg"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Envíanos un Mensaje
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nombre */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all outline-none"
                  placeholder="Tu nombre"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all outline-none"
                  placeholder="tu@email.com"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all outline-none"
                  placeholder="+56 9 XXXX XXXX"
                />
              </div>

              {/* Tipo de Servicio */}
              <div>
                <label htmlFor="service" className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Servicio *
                </label>
                <select
                  id="service"
                  name="service"
                  required
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all outline-none"
                >
                  <option value="">Selecciona un servicio</option>
                  <option value="Flete en Santiago">Flete en Santiago</option>
                  <option value="Mudanza de Hogar">Mudanza de Hogar</option>
                  <option value="Mudanza de Oficina">Mudanza de Oficina</option>
                  <option value="Traslado a Regiones">Traslado a Regiones</option>
                  <option value="Servicio Corporativo">Servicio Corporativo</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Mensaje */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Mensaje *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all outline-none resize-none"
                  placeholder="Cuéntanos qué necesitas..."
                />
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                className="w-full px-6 py-4 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-all duration-300 font-bold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span>Enviar Mensaje</span>
                <Send size={20} />
              </button>

              <p className="text-xs text-gray-500 text-center">
                * Al enviar, serás redirigido a WhatsApp para completar tu consulta
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


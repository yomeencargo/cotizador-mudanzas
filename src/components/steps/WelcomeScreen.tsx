'use client'

import { Truck, Clock, Shield, DollarSign, CheckCircle, TrendingDown } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface WelcomeScreenProps {
  onNext: () => void
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Cotiza tu Mudanza en <span className="text-primary-600">Minutos</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Sistema inteligente de cotización para mudanzas y fletes. 
          Obtén el precio exacto de tu mudanza de forma rápida, fácil y transparente.
        </p>
        <Button onClick={onNext} size="lg" className="px-12 text-lg animate-float">
          Comenzar Cotización
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card className="text-center hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Rápido y Fácil</h3>
          <p className="text-gray-600">
            Completa el formulario en menos de 5 minutos y obtén tu cotización al instante
          </p>
        </Card>

        <Card className="text-center hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-secondary-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Precio Transparente</h3>
          <p className="text-gray-600">
            Sin sorpresas. Conoce el precio exacto antes de confirmar tu mudanza
          </p>
        </Card>

        <Card className="text-center hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">100% Seguro</h3>
          <p className="text-gray-600">
            Todos nuestros servicios incluyen seguro de transporte de mercancías
          </p>
        </Card>

        <Card className="text-center hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Flota Moderna</h3>
          <p className="text-gray-600">
            Vehículos nuevos y equipados para todo tipo de mudanzas
          </p>
        </Card>

        <Card className="text-center hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Personal Calificado</h3>
          <p className="text-gray-600">
            Equipo profesional con experiencia en mudanzas y manejo de objetos delicados
          </p>
        </Card>

        <Card className="text-center hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Descuentos</h3>
          <p className="text-gray-600">
            Obtén hasta 10% de descuento si eres flexible con la fecha de tu mudanza
          </p>
        </Card>
      </div>

      {/* How it works */}
      <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-0 mb-8">
        <h2 className="text-3xl font-bold text-center mb-8">¿Cómo funciona?</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: 1, title: 'Datos Personales', desc: 'Ingresa tu información de contacto' },
            { step: 2, title: 'Detalles de Mudanza', desc: 'Selecciona fecha, direcciones y tipo de vivienda' },
            { step: 3, title: 'Selecciona Items', desc: 'Marca todos los muebles y objetos a transportar' },
            { step: 4, title: 'Obtén tu Cotización', desc: 'Recibe precio instantáneo y confirma tu reserva' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                {item.step}
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <div className="text-center">
        <Button onClick={onNext} size="lg" className="px-12 text-lg">
          Comenzar Ahora →
        </Button>
        <p className="text-sm text-gray-500 mt-4">
          ⏱️ Tiempo estimado: 3-5 minutos
        </p>
      </div>
    </div>
  )
}


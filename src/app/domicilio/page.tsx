'use client'

import { useState, useEffect, useRef } from 'react'
import HomePersonalInfoStep from '@/components/steps/home/HomePersonalInfoStep'
import HomeAddressStep from '@/components/steps/home/HomeAddressStep'
import HomeSummaryStep from '@/components/steps/home/HomeSummaryStep'
import { useHomeQuoteStore } from '@/store/homeQuoteStore'
import ProgressBar from '@/components/ui/ProgressBar'
import ChatBot from '@/components/ui/ChatBot'

const steps = [
  { id: 0, name: 'Datos Personales', component: HomePersonalInfoStep },
  { id: 1, name: 'Dirección de Visita', component: HomeAddressStep },
  { id: 2, name: 'Resumen y Pago', component: HomeSummaryStep },
]

export default function DomicilioPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const { resetQuote, isConfirmed } = useHomeQuoteStore()
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Hacer scroll automático cuando cambia el paso
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [currentStep])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleReset = () => {
    resetQuote()
    setCurrentStep(0)
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <main className="min-h-screen">
      {/* Barra de progreso */}
      <ProgressBar 
        currentStep={currentStep} 
        totalSteps={steps.length}
        isCompleted={isConfirmed}
        stepLabels={steps.map(s => s.name)}
        onStepClick={(step) => {
          setCurrentStep(step)
        }}
      />
      
      <div ref={mainContentRef} className="container mx-auto px-4 py-8">
        {/* Header con información del servicio */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 border border-primary-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🏠 Cotización a Domicilio
            </h1>
            <p className="text-gray-700 mb-4">
              Te visitamos en tu hogar para realizar una cotización completa y personalizada
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary-600">$23.000</p>
                <p className="text-xs text-gray-600">Precio fijo</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-secondary-600">RM</p>
                <p className="text-xs text-gray-600">Solo Región Metropolitana</p>
              </div>
            </div>
          </div>
        </div>

        {/* Componente del paso actual */}
        <CurrentStepComponent
          onNext={handleNext}
          onPrevious={handlePrevious}
          onReset={handleReset}
        />
      </div>

      <ChatBot />

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-gray-500">
            ©2025 - Desarrollado por{' '}
            <a 
              href="https://iaenblanco.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              IAenBlanco.com
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}

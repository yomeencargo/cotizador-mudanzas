'use client'

import { useState, useEffect, useRef } from 'react'
import WelcomeScreen from '@/components/steps/WelcomeScreen'
import PersonalInfoStep from '@/components/steps/PersonalInfoStep'
import DateTimeStep from '@/components/steps/DateTimeStep'
import AddressStep from '@/components/steps/AddressStep'
import PropertyDetailsStep from '@/components/steps/PropertyDetailsStep'
import ItemsSelectionStep from '@/components/steps/ItemsSelectionStep'
import AdditionalServicesStep from '@/components/steps/AdditionalServicesStep'
import SummaryStep from '@/components/steps/SummaryStep'
import { useQuoteStore } from '@/store/quoteStore'
import ProgressBar from '@/components/ui/ProgressBar'
import ChatBot from '@/components/ui/ChatBot'

const steps = [
  { id: 0, name: 'Bienvenida', component: WelcomeScreen },
  { id: 1, name: 'Datos Personales', component: PersonalInfoStep },
  { id: 2, name: 'Fecha y Hora', component: DateTimeStep },
  { id: 3, name: 'Direcciones', component: AddressStep },
  { id: 4, name: 'Detalles de Propiedad', component: PropertyDetailsStep },
  { id: 5, name: 'Selección de Items', component: ItemsSelectionStep },
  { id: 6, name: 'Servicios Adicionales', component: AdditionalServicesStep },
  { id: 7, name: 'Resumen', component: SummaryStep },
]

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0)
  const { resetQuote, isConfirmed } = useQuoteStore()
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Hacer scroll automático cuando cambia el paso
  useEffect(() => {
    // Pequeño delay para asegurar que el DOM se ha actualizado
    const timeoutId = setTimeout(() => {
      // Scroll al inicio de la página
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
      {currentStep > 0 && (
        <ProgressBar 
          currentStep={currentStep - 1} 
          totalSteps={steps.length - 1}
          isCompleted={isConfirmed}
          onStepClick={(step) => {
            setCurrentStep(step + 1)
          }}
        />
      )}
      
      <div ref={mainContentRef} className="container mx-auto px-4 py-8">
        <CurrentStepComponent
          onNext={handleNext}
          onPrevious={handlePrevious}
          onReset={handleReset}
          currentStep={currentStep}
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


'use client'

import { useState } from 'react'
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleReset = () => {
    resetQuote()
    setCurrentStep(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}
      
      <div className="container mx-auto px-4 py-8">
        <CurrentStepComponent
          onNext={handleNext}
          onPrevious={handlePrevious}
          onReset={handleReset}
          currentStep={currentStep}
        />
      </div>

      <ChatBot />
    </main>
  )
}


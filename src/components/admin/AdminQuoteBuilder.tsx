'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import PersonalInfoStep from '@/components/steps/PersonalInfoStep'
import DateTimeStep from '@/components/steps/DateTimeStep'
import AddressStep from '@/components/steps/AddressStep'
import PropertyDetailsStep from '@/components/steps/PropertyDetailsStep'
import ItemsSelectionStep from '@/components/steps/ItemsSelectionStep'
import AdditionalServicesStep from '@/components/steps/AdditionalServicesStep'
import AdminQuoteSummary, { clearAdminQuoteId } from '@/components/admin/AdminQuoteSummary'
import { useQuoteStore } from '@/store/quoteStore'

/**
 * COTIZADOR INTERNO.
 *
 * Los seis primeros pasos son LOS MISMOS componentes del cotizador web, con el mismo
 * store: mismos datos pedidos, mismas validaciones y mismo cálculo de precio. Solo cambia
 * el último paso (`AdminQuoteSummary`), donde la secretaria puede fijar el precio final.
 *
 * El store es el de la web y persiste en el navegador, así que una cotización a medias
 * sobrevive a cambiar de pestaña del panel. «Empezar de cero» lo limpia.
 */
const PASOS = [
  PersonalInfoStep,
  DateTimeStep,
  AddressStep,
  PropertyDetailsStep,
  ItemsSelectionStep,
  AdditionalServicesStep,
] as const

export default function AdminQuoteBuilder({ onGoToProspects }: { onGoToProspects: () => void }) {
  const [step, setStep] = useState(0)
  const resetQuote = useQuoteStore((s) => s.resetQuote)
  const totalPasos = PASOS.length + 1

  const empezarDeCero = () => {
    resetQuote()
    clearAdminQuoteId()
    setStep(0)
  }

  const siguiente = () => {
    setStep((s) => Math.min(s + 1, totalPasos - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const anterior = () => {
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const Paso = step < PASOS.length ? PASOS[step] : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nueva cotización</h2>
          <p className="text-sm text-gray-600">
            Los mismos pasos del cotizador web. Al final puedes ajustar el precio antes de enviarla.
          </p>
        </div>
        <Button
          onClick={() => {
            if (confirm('¿Borrar los datos de esta cotización y empezar de cero?')) empezarDeCero()
          }}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Empezar de cero
        </Button>
      </div>

      <ProgressBar currentStep={step} totalSteps={totalPasos} onStepClick={(s) => s < step && setStep(s)} />

      {Paso ? (
        <Paso onNext={siguiente} onPrevious={anterior} />
      ) : (
        <AdminQuoteSummary
          onPrevious={anterior}
          onStartOver={empezarDeCero}
          onGoToProspects={onGoToProspects}
        />
      )}
    </div>
  )
}

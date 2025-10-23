import { Check } from 'lucide-react'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  onStepClick?: (step: number) => void
  isCompleted?: boolean
}

const stepNames = [
  'Tus Datos',
  'Fecha y Hora',
  'Direcciones',
  'Detalles',
  'Inventario',
  'Servicios',
  'Resumen'
]

export default function ProgressBar({ currentStep, totalSteps, onStepClick, isCompleted = false }: ProgressBarProps) {
  return (
    <div className="sticky top-0 z-50 bg-white shadow-md border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2 md:space-x-4">
            {stepNames.map((stepName, index) => {
              const stepNumber = index + 1
              const isCompleted = index < currentStep
              const isCurrent = index === currentStep
              const isFuture = index > currentStep

              return (
                <div key={index} className="flex items-center">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => onStepClick && onStepClick(index)}
                      disabled={!onStepClick}
                      className={`
                        w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center
                        transition-all duration-300 ease-in-out
                        ${
                          isCompleted
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : isCurrent
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        }
                        ${onStepClick ? 'cursor-pointer' : 'cursor-default'}
                        ${onStepClick ? 'hover:scale-105' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 md:w-5 md:h-5" />
                      ) : (
                        <span className="text-sm md:text-base font-semibold">
                          {stepNumber}
                        </span>
                      )}
                    </button>
                    
                    {/* Step Label */}
                    <button
                      onClick={() => onStepClick && onStepClick(index)}
                      disabled={!onStepClick}
                      className={`
                        mt-2 text-xs md:text-sm font-medium text-center
                        transition-colors duration-300
                        ${
                          isCompleted || isCurrent
                            ? 'text-primary-600'
                            : 'text-gray-500'
                        }
                        ${onStepClick ? 'cursor-pointer hover:text-primary-500' : 'cursor-default'}
                      `}
                    >
                      {stepName}
                    </button>
                  </div>

                  {/* Connecting Line */}
                  {index < stepNames.length - 1 && (
                    <div
                      className={`
                        h-0.5 md:h-1 mx-2 md:mx-4 transition-colors duration-300
                        ${
                          index < currentStep
                            ? 'bg-primary-600'
                            : 'bg-gray-200'
                        }
                      `}
                      style={{ width: '40px' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Progress Percentage */}
        <div className="text-center mt-3">
          <span className="text-xs text-gray-500">
            {isCompleted ? '100' : Math.round(((currentStep + 1) / (totalSteps + 1)) * 100)}% completado
          </span>
        </div>
      </div>
    </div>
  )
}


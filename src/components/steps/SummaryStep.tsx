'use client'

import { useEffect, useState } from 'react'
import { useQuoteStore } from '@/store/quoteStore'
import Button from '../ui/Button'
import Card from '../ui/Card'
import {
  Calendar,
  MapPin,
  Package,
  DollarSign,
  Download,
  Send,
  Edit,
  CheckCircle,
  CreditCard,
  Mail,
} from 'lucide-react'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { generateQuotePDF } from '@/lib/pdfGenerator'
import { getPricingConfig } from '@/lib/pricingService'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

// Configuración de precios por defecto para evitar errores
const DEFAULT_PRICING = {
  services: {
    disassembly: 15000,
    assembly: 15000,
    packing: 25000,
    unpacking: 20000
  }
}

interface SummaryStepProps {
  onPrevious: () => void
  onReset: () => void
  currentStep: number
}

export default function SummaryStep({ onPrevious, onReset }: SummaryStepProps) {
  const {
    personalInfo,
    dateTime,
    isFlexible,
    origin,
    destination,
    items,
    additionalServices,
    totalVolume,
    totalWeight,
    totalDistance,
    estimatedPrice,
    recommendedVehicle,
    isConfirmed,
    calculateTotals,
    setConfirmed,
  } = useQuoteStore()

  const [freeKilometers, setFreeKilometers] = useState(50) // Valor por defecto
  const [pricingConfig, setPricingConfig] = useState(DEFAULT_PRICING) // Configuración dinámica

  // Cargar configuración de precios dinámicamente desde el panel de admin
  useEffect(() => {
    const loadPricingConfig = async () => {
      try {
        const pricing = await getPricingConfig()
        setFreeKilometers(pricing.freeKilometers)
        
        // Actualizar la configuración de precios con los valores del admin
        setPricingConfig({
          services: {
            disassembly: pricing.additionalServices.disassembly,
            assembly: pricing.additionalServices.assembly,
            packing: pricing.additionalServices.packing,
            unpacking: pricing.additionalServices.unpacking
          }
        })
      } catch (error) {
        console.error('Error loading pricing config:', error)
        // Mantener los valores por defecto si falla
      }
    }
    loadPricingConfig()
  }, [])

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    calculateTotals()
  }, [calculateTotals])

  const handleSendQuote = async () => {
    setIsSubmitting(true)
    
    // Simular envío de cotización
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    toast.success('¡Cotización enviada a tu correo!')
    setIsSubmitting(false)
  }

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Generando PDF...', { id: 'pdf-generation' })
      await generateQuotePDF()
      toast.success('PDF descargado exitosamente!', { id: 'pdf-generation' })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el PDF', { id: 'pdf-generation' })
    }
  }

  const handleConfirmReservation = async () => {
    setIsSubmitting(true)
    
    try {
      // Crear reserva en la BD
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: `Q-${Date.now()}`,
          client_name: personalInfo?.name,
          client_email: personalInfo?.email,
          client_phone: personalInfo?.phone,
          scheduled_date: dateTime ? format(new Date(dateTime), 'yyyy-MM-dd') : null,
          scheduled_time: dateTime ? format(new Date(dateTime), 'HH:mm') : null,
          duration_hours: 4,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear la reserva')
      }

      const result = await response.json()
      
      setConfirmed(true)
      toast.success('¡Reserva confirmada! Te contactaremos pronto.')
    } catch (error) {
      console.error('Error confirming reservation:', error)
      toast.error(error instanceof Error ? error.message : 'Error al confirmar la reserva')
      setIsSubmitting(false)
      return
    }
  }

  if (isConfirmed) {
    return (
      <div className="max-w-2xl mx-auto text-center animate-slide-up">
        <Card variant="elevated" className="py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Reserva Confirmada!</h2>
          <p className="text-lg text-gray-600 mb-8">
            Tu solicitud de cotización ha sido enviada exitosamente.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold mb-3">📧 ¿Qué sigue?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ Recibirás un correo con la cotización detallada</li>
              <li>✅ Te contactaremos vía WhatsApp para confirmar detalles</li>
              <li>✅ Un ejecutivo te llamará en las próximas 24 horas</li>
              <li>✅ Podrás realizar el pago y confirmar tu reserva</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button onClick={handleDownloadPDF} variant="outline" className="w-full" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Descargar Cotización PDF
            </Button>
            <Button onClick={handleSendQuote} variant="secondary" className="w-full" size="lg">
              <Send className="w-5 h-5 mr-2" />
              Enviar por Email
            </Button>
            <Button onClick={onReset} variant="ghost" className="w-full" size="lg">
              Nueva Cotización
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Resumen de tu Cotización</h2>
        <p className="text-gray-600">Revisa todos los detalles antes de confirmar</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Detalles */}
        <div className="lg:col-span-2 space-y-4">
          {/* Datos Personales */}
          <Card>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-600" />
              Datos de Contacto
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Nombre:</span>
                <p className="font-semibold">{personalInfo?.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="font-semibold">{personalInfo?.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Teléfono:</span>
                <p className="font-semibold">{personalInfo?.phone}</p>
              </div>
              {personalInfo?.isCompany && (
                <>
                  <div>
                    <span className="text-sm text-gray-500">Razón Social:</span>
                    <p className="font-semibold">{personalInfo?.companyName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">RUT:</span>
                    <p className="font-semibold">{personalInfo?.companyRut}</p>
                    <span className="text-xs text-green-600">✓ Con factura</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Fecha y Hora */}
          <Card>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Fecha y Hora
            </h3>
            <p className="text-gray-700">
              📅 {dateTime && formatDate(new Date(dateTime))}
            </p>
            <p className="text-gray-700">
              🕐 {dateTime && formatTime(new Date(dateTime))}
            </p>
            {isFlexible && (
              <p className="text-green-600 mt-2 text-sm font-semibold">
                ✅ Con descuento por flexibilidad (-10%)
              </p>
            )}
          </Card>

          {/* Direcciones */}
          <Card>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              Direcciones
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 block mb-1">🔵 Origen:</span>
                <p className="font-semibold">
                  {origin.address?.street} {origin.address?.number}
                </p>
                <p className="text-sm text-gray-600">{origin.address?.commune}</p>
                <p className="text-sm text-gray-600">
                  {origin.details?.propertyType} - Piso {origin.details?.floor}
                  {origin.details?.hasElevator ? ' (con ascensor)' : ' (sin ascensor)'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">🟢 Destino:</span>
                <p className="font-semibold">
                  {destination.address?.street} {destination.address?.number}
                </p>
                <p className="text-sm text-gray-600">{destination.address?.commune}</p>
                <p className="text-sm text-gray-600">
                  {destination.details?.propertyType} - Piso {destination.details?.floor}
                  {destination.details?.hasElevator ? ' (con ascensor)' : ' (sin ascensor)'}
                </p>
              </div>
            </div>
            
            {/* Distancia calculada */}
            {totalDistance > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">📏 Distancia estimada:</span>
                  <span className="font-semibold text-primary-600">{totalDistance} km</span>
                </div>
                {totalDistance > freeKilometers && (
                  <p className="text-xs text-gray-500 mt-1">
                    Primeros {freeKilometers} km incluidos. 
                    Se cobran {totalDistance - freeKilometers} km adicionales.
                  </p>
                )}
                {totalDistance <= freeKilometers && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Distancia incluida en el precio base (hasta {freeKilometers} km gratis)
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Items */}
          <Card>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Items a Transportar ({items.reduce((sum, item) => sum + item.quantity, 0)} items)
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {items.map((item) => {
                const hasPackaging = item.packaging && item.packaging.type !== 'none'
                
                return (
                  <div
                    key={item.id}
                    className="p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {item.name} <span className="text-gray-500">x{item.quantity}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        {(item.volume * item.quantity).toFixed(2)} m³
                      </span>
                    </div>
                    {hasPackaging && (
                      <div className="mt-1 text-xs text-green-700">
                        📦 Con embalaje especial
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Volumen Total</p>
                <p className="font-bold text-lg">{totalVolume.toFixed(2)} m³</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Peso Total</p>
                <p className="font-bold text-lg">{totalWeight} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vehículo</p>
                <p className="font-bold text-lg">🚚</p>
                <p className="text-xs text-gray-600">{recommendedVehicle}</p>
              </div>
            </div>
          </Card>

          {/* Embalaje Especial */}
          {items.some(item => item.packaging && item.packaging.type !== 'none') && (() => {
            // Obtener tipos únicos de embalaje
            const packagingTypes = new Set(
              items
                .filter(item => item.packaging && item.packaging.type !== 'none')
                .map(item => item.packaging?.pricePerUnit || 0)
            )
            
            // Calcular costo total (precio por m³ × m³ totales por cada tipo)
            const packagingCost = Array.from(packagingTypes).reduce((sum, pricePerUnit) => {
              return sum + (pricePerUnit * totalVolume)
            }, 0)
            
            return (
              <Card>
                <h3 className="font-bold text-lg mb-4">📦 Embalaje Especial</h3>
                
                {/* Info importante */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Nota:</strong> El embalaje especial se cobra multiplicando el precio por los {totalVolume.toFixed(1)} m³ totales de tu mudanza.
                  </p>
                </div>
                
                {/* Tipos de embalaje seleccionados */}
                <div className="space-y-2 mb-4">
                  {items
                    .filter(item => item.packaging && item.packaging.type !== 'none')
                    .map((item, index, array) => {
                      // Solo mostrar una vez cada tipo de embalaje
                      const isFirstOfType = array.findIndex(i => i.packaging?.pricePerUnit === item.packaging?.pricePerUnit) === index
                      
                      if (!isFirstOfType) return null
                      
                      const packagingTotal = item.packaging 
                        ? item.packaging.pricePerUnit * totalVolume 
                        : 0
                      
                      return (
                        <div key={`packaging-${item.id}`} className="flex justify-between text-sm">
                          <span>
                            Items con este tipo de embalaje
                            <span className="text-gray-500"> (${item.packaging?.pricePerUnit.toLocaleString()} por m³)</span>
                          </span>
                          <span className="font-semibold">
                            ${packagingTotal.toLocaleString()}
                          </span>
                        </div>
                      )
                    })}
                </div>
                
                {/* Total */}
                <div className="mt-4 pt-4 border-t flex justify-between font-bold text-green-700">
                  <span>Total Embalaje Especial ({totalVolume.toFixed(1)} m³ × precio por m³):</span>
                  <span>${packagingCost.toLocaleString()}</span>
                </div>
              </Card>
            )
          })()}

          {/* Servicios Adicionales */}
          {(additionalServices.disassembly ||
            additionalServices.assembly ||
            additionalServices.packing ||
            additionalServices.unpacking ||
            additionalServices.observations) && (
            <Card>
              <h3 className="font-bold text-lg mb-4">Servicios Adicionales</h3>
              <div className="space-y-2">
                {additionalServices.disassembly && (
                  <div className="flex justify-between text-sm">
                    <span>✓ Desarme de muebles</span>
                    <span className="font-semibold">${pricingConfig.services.disassembly.toLocaleString()}</span>
                  </div>
                )}
                {additionalServices.assembly && (
                  <div className="flex justify-between text-sm">
                    <span>✓ Armado de muebles</span>
                    <span className="font-semibold">${pricingConfig.services.assembly.toLocaleString()}</span>
                  </div>
                )}
                {additionalServices.packing && (
                  <div className="flex justify-between text-sm">
                    <span>✓ Embalaje profesional</span>
                    <span className="font-semibold">${pricingConfig.services.packing.toLocaleString()}</span>
                  </div>
                )}
                {additionalServices.unpacking && (
                  <div className="flex justify-between text-sm">
                    <span>✓ Desembalaje</span>
                    <span className="font-semibold">${pricingConfig.services.unpacking.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {additionalServices.observations && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-1">Observaciones:</p>
                  <p className="text-sm text-gray-700">{additionalServices.observations}</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Columna derecha - Precio y Acciones */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Precio */}
            <Card variant="elevated" className="bg-gradient-to-br from-primary-50 to-secondary-50">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary-600" />
                Precio Estimado
              </h3>
              <div className="py-6">
                {isFlexible ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-4">
                      <span className="text-sm text-gray-600">Precio base:</span>
                      <span className="text-lg font-semibold text-gray-700 line-through">
                        {formatCurrency(Math.round(estimatedPrice / 0.9))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-4">
                      <span className="text-sm font-semibold text-green-600">
                        Descuento por flexibilidad:
                      </span>
                      <span className="text-lg font-semibold text-green-600">
                        -10%
                      </span>
                    </div>
                    <div className="border-t border-gray-300 pt-3 px-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total a pagar:</span>
                        <span className="text-4xl font-bold text-primary-600">
                          {formatCurrency(estimatedPrice)}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">IVA incluido</p>
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        ¡Ahorraste {formatCurrency(Math.round(estimatedPrice / 0.9) - estimatedPrice)}!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Total a pagar:</p>
                    <p className="text-4xl font-bold text-primary-600 mb-2">
                      {formatCurrency(estimatedPrice)}
                    </p>
                    <p className="text-xs text-gray-500">IVA incluido</p>
                  </div>
                )}
                
                {/* Datos de Facturación */}
                {personalInfo?.isCompany && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-bold text-blue-900 text-center mb-2">
                        📄 CON FACTURA
                      </p>
                      <div className="text-xs text-blue-800">
                        <p className="font-semibold">Razón Social:</p>
                        <p className="mb-2">{personalInfo.companyName}</p>
                        <p className="font-semibold">RUT:</p>
                        <p>{personalInfo.companyRut}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Opciones de Pago */}
            <Card>
              <h3 className="font-bold text-lg mb-4 text-center">Opciones de Pago</h3>
              
              <div className="space-y-3">
                {/* Opción 1: Pago 100% */}
                <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ¡Ahorra 5%!
                  </div>
                  <div className="text-center mb-3 mt-2">
                    <p className="text-sm text-gray-600 mb-1">Paga el 100%</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(Math.round(estimatedPrice * 0.95))}
                    </p>
                    <p className="text-xs text-green-600 font-semibold">
                      Descuento de {formatCurrency(Math.round(estimatedPrice * 0.05))}
                    </p>
                  </div>
                  <Button
                    onClick={handleConfirmReservation}
                    isLoading={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    Pagar 100%
                  </Button>
                </div>

                {/* Opción 2: Pago 50% */}
                <div className="border-2 border-primary-500 rounded-lg p-4 bg-primary-50">
                  <div className="text-center mb-3">
                    <p className="text-sm text-gray-600 mb-1">Abona el 50%</p>
                    <p className="text-xs text-gray-500 italic mb-2">Paga el otro 50% al terminar el flete</p>
                    <p className="text-2xl font-bold text-primary-700">
                      {formatCurrency(Math.round(estimatedPrice * 0.5))}
                    </p>
                    <p className="text-xs text-gray-600">
                      + {formatCurrency(Math.round(estimatedPrice * 0.5))} al finalizar
                    </p>
                  </div>
                  <Button
                    onClick={handleConfirmReservation}
                    isLoading={isSubmitting}
                    className="w-full"
                    size="lg"
                    variant="secondary"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Abonar 50%
                  </Button>
                </div>

                {/* Botón Editar */}
                <Button
                  onClick={onPrevious}
                  variant="outline"
                  className="w-full mt-4"
                  disabled={isSubmitting}
                >
                  <Edit className="w-5 h-5 mr-2" />
                  Editar Cotización
                </Button>
              </div>
            </Card>

            {/* Info de pago */}
            <Card className="bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Métodos de Pago</p>
                  <p className="text-xs">
                    Aceptamos Webpay, tarjetas de crédito/débito y transferencia bancaria.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


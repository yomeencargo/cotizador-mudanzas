'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuoteStore } from '@/store/quoteStore'
import Button from '../ui/Button'
import Checkbox from '../ui/Checkbox'
import Card from '../ui/Card'
import Select from '../ui/Select'
import { Calendar, Clock, TrendingDown, AlertCircle } from 'lucide-react'
import { format, addDays, isSameDay, startOfDay, endOfMonth, addMonths, startOfMonth, getMonth, getYear } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { PRICING } from '@/config/pricing'

interface DateTimeStepProps {
  onNext: () => void
  onPrevious: () => void
}

interface SlotData {
  time: string
  availableSlots: number
  capacity: number
  booked: number
  isBlocked: boolean
  isAvailable: boolean
  occupancy: string
}

export default function DateTimeStep({ onNext, onPrevious }: DateTimeStepProps) {
  const { dateTime, isFlexible, setDateTime } = useQuoteStore()
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    dateTime ? new Date(dateTime) : null
  )
  const [selectedTime, setSelectedTime] = useState<string>(
    dateTime ? format(new Date(dateTime), 'HH:mm') : ''
  )
  const [flexible, setFlexible] = useState(isFlexible)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<SlotData[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Generar fechas disponibles (mes actual + 2 meses siguientes completos, excluyendo domingos)
  const availableDates = useMemo(() => {
    const today = new Date()
    const tomorrow = startOfDay(addDays(today, 1))
    
    // Calcular el último día disponible: fin del segundo mes siguiente
    // Si hoy es octubre, incluye: resto de octubre + noviembre completo + diciembre completo
    const lastDay = startOfDay(endOfMonth(addMonths(today, 2)))
    
    // Calcular cuántos días hay desde mañana hasta el final del segundo mes siguiente (inclusive)
    const diffInMs = lastDay.getTime() - tomorrow.getTime()
    const totalDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1
    
    // Generar array de fechas excluyendo domingos
    const dates: Date[] = []
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(tomorrow, i)
      if (date.getDay() !== 0) { // Excluir domingos
        dates.push(date)
      }
    }
    
    return dates
  }, [])

  // Agrupar fechas por mes
  const datesByMonth = useMemo(() => {
    return availableDates.reduce((acc, date) => {
      const monthKey = format(date, 'yyyy-MM')
      if (!acc[monthKey]) {
        acc[monthKey] = []
      }
      acc[monthKey].push(date)
      return acc
    }, {} as Record<string, Date[]>)
  }, [availableDates])

  // Obtener lista de meses disponibles (ordenados cronológicamente)
  const availableMonths = useMemo(() => {
    return Object.keys(datesByMonth)
      .sort() // Ordenar las claves yyyy-MM alfabéticamente (que es orden cronológico)
      .map(monthKey => {
        const firstDate = datesByMonth[monthKey][0]
        return {
          key: monthKey,
          label: format(firstDate, 'MMMM yyyy', { locale: es }),
          date: firstDate
        }
      })
  }, [datesByMonth])

  // Establecer el primer mes como seleccionado por defecto
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0].key)
    }
  }, [availableMonths, selectedMonth])

  // Fechas del mes seleccionado
  const datesInSelectedMonth = datesByMonth[selectedMonth] || []

  // NUEVO: Traer disponibilidad cuando cambia la fecha
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedDate])

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true)
      const dateStr = format(selectedDate!, 'yyyy-MM-dd')
      const response = await fetch(`/api/bookings/available?date=${dateStr}`)
      
      if (!response.ok) {
        throw new Error('Error fetching slots')
      }
      
      const data: SlotData[] = await response.json()
      setAvailableSlots(data)
      
      // Si no hay horarios disponibles, limpiar selección
      if (data.length === 0) {
        setSelectedTime('')
      }
    } catch (error) {
      console.error('Error fetching available slots:', error)
      toast.error('Error al obtener disponibilidad')
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  // Horarios disponibles
  const timeSlots = [
    { time: '08:00', label: '08:00 hrs' },
    { time: '09:00', label: '09:00 hrs' },
    { time: '10:00', label: '10:00 hrs' },
    { time: '11:00', label: '11:00 hrs' },
    { time: '14:00', label: '14:00 hrs' },
    { time: '15:00', label: '15:00 hrs' },
  ]

  const handleSubmit = () => {
    if (!selectedDate) {
      toast.error('Por favor selecciona una fecha')
      return
    }

    if (!selectedTime) {
      toast.error('Por favor selecciona un horario')
      return
    }

    const [hours, minutes] = selectedTime.split(':').map(Number)
    const dateWithTime = new Date(selectedDate)
    dateWithTime.setHours(hours, minutes, 0, 0)

    setDateTime(dateWithTime, flexible)
    toast.success('Fecha y hora guardadas')
    onNext()
  }

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      <Card variant="elevated">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Fecha y Hora de tu Mudanza</h2>
          <p className="text-gray-600">
            Selecciona cuándo quieres realizar tu mudanza
          </p>
        </div>

        {/* Descuento por flexibilidad */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-6 h-6 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-1">
                🎉 ¡Ahorra hasta un 10% siendo flexible!
              </h3>
              <p className="text-sm text-green-800 mb-3">
                Si tienes flexibilidad en la fecha, podemos ofrecerte un mejor precio
              </p>
              <Checkbox
                label="Tengo flexibilidad de fecha (descuento del 10%)"
                checked={flexible}
                onChange={(e) => setFlexible(e.target.checked)}
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Selección de Fecha */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold">Selecciona una Fecha</h3>
            </div>
            
            {/* Selector de Mes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Selecciona el mes
              </label>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                options={availableMonths.map(month => ({
                  value: month.key,
                  label: month.label
                }))}
                className="text-base font-semibold capitalize shadow-sm"
              />
            </div>

            {/* Días del mes seleccionado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📆 Selecciona el día
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
              {datesInSelectedMonth.map((date) => {
                const isSelected = selectedDate && isSameDay(date, selectedDate)
                const isWeekend = date.getDay() === 6
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      p-3 rounded-lg border-2 text-center transition-all hover:scale-105
                      ${isSelected 
                        ? 'border-primary-600 bg-primary-50 shadow-md' 
                        : 'border-gray-200 hover:border-primary-300'
                      }
                      ${isWeekend ? 'bg-yellow-50' : ''}
                    `}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {format(date, 'EEE', { locale: es })}
                    </div>
                    <div className="text-lg font-bold">
                      {format(date, 'd')}
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(date, 'MMM', { locale: es })}
                    </div>
                    {isWeekend && PRICING.saturdaySurcharge > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        +${(PRICING.saturdaySurcharge / 1000).toFixed(0)}k
                      </div>
                    )}
                  </button>
                )
              })}
              </div>
            </div>
          </div>

          {/* Selección de Hora - MEJORADO CON API */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold">Selecciona un Horario</h3>
              </div>
              {selectedDate && availableSlots.length > 0 && (
                <div className="text-sm font-semibold text-gray-700 bg-blue-50 px-3 py-1 rounded flex items-center gap-1">
                  🚚 {availableSlots[0]?.capacity} camión{availableSlots[0]?.capacity > 1 ? 'es' : ''}
                </div>
              )}
            </div>

            {loadingSlots && selectedDate && (
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-blue-700">Cargando disponibilidad...</p>
              </div>
            )}

            {!loadingSlots && selectedDate && availableSlots.length === 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
                <p className="text-red-700 font-semibold">
                  ❌ No hay disponibilidad para esta fecha
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Por favor elige otro día
                </p>
              </div>
            )}

            {!loadingSlots && availableSlots.length > 0 && (
              <div className="space-y-2">
                {availableSlots.map((slotData) => {
                  const isSelected = selectedTime === slotData.time
                  const isMorning = parseInt(slotData.time) < 12

                  return (
                    <button
                      key={slotData.time}
                      onClick={() => setSelectedTime(slotData.time)}
                      className={`
                        w-full p-4 rounded-lg border-2 text-left transition-all
                        ${isSelected 
                          ? 'border-primary-600 bg-primary-50 shadow-md' 
                          : 'border-gray-200 hover:border-primary-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-semibold w-16">{slotData.time} hrs</span>
                          
                          {/* Mostrar ocupación con iconos de camiones */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: slotData.capacity }).map((_, i) => (
                              <div
                                key={i}
                                className={`
                                  w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                                  ${i < slotData.booked
                                    ? 'bg-red-200 text-red-700'
                                    : 'bg-green-200 text-green-700'
                                  }
                                `}
                                title={i < slotData.booked ? 'Ocupado' : 'Disponible'}
                              >
                                🚚
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-gray-700 text-sm">
                            {slotData.availableSlots} disponible{slotData.availableSlots !== 1 ? 's' : ''}
                          </p>
                          {isMorning && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              ⭐ Recomendado
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Resumen */}
            {selectedDate && selectedTime && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Selección Confirmada:</h4>
                <p className="text-gray-700">
                  📅 {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-gray-700">
                  🕐 {selectedTime} hrs
                </p>
                {flexible && (
                  <p className="text-green-600 mt-2 text-sm font-semibold">
                    ✅ Con descuento por flexibilidad (-10%)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Las mudanzas en horario de mañana son más eficientes.
          </p>
          <p className="text-sm text-blue-800 mt-2">
            <strong>📅 Domingos:</strong> Si necesitas agendar para un domingo, 
            contáctanos directamente por WhatsApp o correo electrónico.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-4 mt-6">
          <Button
            type="button"
            onClick={onPrevious}
            variant="outline"
            className="flex-1"
          >
            ← Volver
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="flex-1"
            disabled={!selectedDate || !selectedTime}
          >
            Continuar →
          </Button>
        </div>
      </Card>
    </div>
  )
}


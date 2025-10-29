'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  Phone,
  Mail,
  MapPin,
  DollarSign
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  quote_id: string
  client_name: string
  client_email: string
  client_phone: string
  scheduled_date: string
  scheduled_time: string
  duration_hours: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  payment_type?: string
  total_price?: number
  original_price?: number
  origin_address?: string
  destination_address?: string
  created_at: string
  confirmed_at?: string
  completed_at?: string
  cancelled_at?: string
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/bookings')
      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Error al cargar las reservas')
    } finally {
      setLoading(false)
    }
  }

  const filterBookings = useCallback(() => {
    let filtered = [...bookings]

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.client_phone.includes(searchTerm) ||
        booking.quote_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Filtrar por fecha
    if (dateFilter !== 'all') {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.scheduled_date)
        
        switch (dateFilter) {
          case 'today':
            return bookingDate.toDateString() === today.toDateString()
          case 'tomorrow':
            return bookingDate.toDateString() === tomorrow.toDateString()
          case 'week':
            return bookingDate >= today && bookingDate <= nextWeek
          case 'month':
            return bookingDate.getMonth() === today.getMonth() && 
                   bookingDate.getFullYear() === today.getFullYear()
          default:
            return true
        }
      })
    }

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, dateFilter])

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [filterBookings])

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el estado')
      }

      toast.success('Estado actualizado correctamente')
      fetchBookings()
    } catch (error) {
      console.error('Error updating booking status:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const updatePaymentType = async (bookingId: string, newPaymentType: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_type: newPaymentType })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el tipo de pago')
      }

      toast.success('Tipo de pago actualizado correctamente')
      fetchBookings()
    } catch (error) {
      console.error('Error updating payment type:', error)
      toast.error('Error al actualizar el tipo de pago')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-200'
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reservas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Reservas</h2>
          <p className="text-gray-600">
            {filteredBookings.length} de {bookings.length} reservas
          </p>
        </div>
        <Button onClick={fetchBookings} variant="outline" size="sm">
          🔄 Actualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cliente, email, teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'pending', label: 'Pendiente' },
                { value: 'confirmed', label: 'Confirmado' },
                { value: 'completed', label: 'Completado' },
                { value: 'cancelled', label: 'Cancelado' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todas las fechas' },
                { value: 'today', label: 'Hoy' },
                { value: 'tomorrow', label: 'Mañana' },
                { value: 'week', label: 'Esta semana' },
                { value: 'month', label: 'Este mes' },
              ]}
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setDateFilter('all')
              }}
              variant="outline"
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card className="overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron reservas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.client_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {booking.quote_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(booking.scheduled_date), 'dd/MM/yyyy', { locale: es })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.scheduled_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(booking.original_price || booking.total_price) ? (
                        <div>
                          <div className="text-sm font-semibold text-green-700">
                            ${(booking.original_price || booking.total_price)?.toLocaleString()}
                          </div>
                          {booking.payment_type === 'mitad' && booking.original_price && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                              Pagado: ${(booking.total_price || 0).toLocaleString()} (mitad)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.client_phone}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.client_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              setSelectedBooking(booking)
                              setShowDetailsModal(true)
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedBooking(booking)
                              setShowEditModal(true)
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                        {booking.payment_type === 'mitad' && (
                          <Button
                            onClick={() => {
                              if (confirm('¿Cambiar el estado de pago de "mitad" a "completo"?')) {
                                updatePaymentType(booking.id, 'completo')
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          >
                            ✓ Marcar completo
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles de la Reserva"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <p className="text-sm text-gray-900">{selectedBooking.client_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ID Cotización</label>
                <p className="text-sm text-gray-900">{selectedBooking.quote_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{selectedBooking.client_email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <p className="text-sm text-gray-900">{selectedBooking.client_phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <p className="text-sm text-gray-900">
                  {format(new Date(selectedBooking.scheduled_date), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hora</label>
                <p className="text-sm text-gray-900">{selectedBooking.scheduled_time}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedBooking.status)}`}>
                {getStatusIcon(selectedBooking.status)}
                {selectedBooking.status}
              </span>
            </div>

            {selectedBooking.original_price && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio Total</label>
                <p className="text-sm font-semibold text-green-700">
                  ${selectedBooking.original_price.toLocaleString()}
                </p>
                {selectedBooking.payment_type === 'mitad' && (
                  <p className="text-xs text-gray-600 mt-1">
                    Pagado: ${selectedBooking.total_price?.toLocaleString()} (mitad)
                  </p>
                )}
              </div>
            )}

            {selectedBooking.payment_type && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Pago</label>
                <p className="text-sm text-gray-900 capitalize">{selectedBooking.payment_type}</p>
              </div>
            )}

            {selectedBooking.origin_address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Dirección Origen
                </label>
                <p className="text-sm text-gray-900">{selectedBooking.origin_address}</p>
              </div>
            )}

            {selectedBooking.destination_address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  Dirección Destino
                </label>
                <p className="text-sm text-gray-900">{selectedBooking.destination_address}</p>
              </div>
            )}

            {selectedBooking.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Notas</label>
                <p className="text-sm text-gray-900">{selectedBooking.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setShowDetailsModal(false)}
                variant="outline"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Reserva"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <Select
                value={selectedBooking.status}
                onChange={(e) => {
                  setSelectedBooking({
                    ...selectedBooking,
                    status: e.target.value as any
                  })
                }}
                options={[
                  { value: 'pending', label: 'Pendiente' },
                  { value: 'confirmed', label: 'Confirmado' },
                  { value: 'completed', label: 'Completado' },
                  { value: 'cancelled', label: 'Cancelado' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                value={selectedBooking.notes || ''}
                onChange={(e) => {
                  setSelectedBooking({
                    ...selectedBooking,
                    notes: e.target.value
                  })
                }}
                placeholder="Agregar notas sobre esta reserva..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  await updateBookingStatus(selectedBooking.id, selectedBooking.status)
                  setShowEditModal(false)
                }}
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

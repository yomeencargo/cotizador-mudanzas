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
  DollarSign,
  Plus,
  Download
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
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [blockOnly, setBlockOnly] = useState(false)
  const [newBooking, setNewBooking] = useState({
    quote_id: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_hours: 4,
    status: 'pending',
    payment_type: '',
    total_price: '',
    original_price: '',
    origin_address: '',
    destination_address: '',
    notes: ''
  })

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
        // Parsear fecha como local para evitar desfase por UTC
        const [y, m, d] = booking.scheduled_date.split('-').map(Number)
        const bookingDate = new Date(y, (m || 1) - 1, d || 1)
        
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
          case 'range': {
            if (!customStartDate && !customEndDate) return true
            let inRange = true
            if (customStartDate) {
              const [sy, sm, sd] = customStartDate.split('-').map(Number)
              const start = new Date(sy, (sm || 1) - 1, sd || 1)
              inRange = inRange && bookingDate >= start
            }
            if (customEndDate) {
              const [ey, em, ed] = customEndDate.split('-').map(Number)
              const end = new Date(ey, (em || 1) - 1, ed || 1)
              // Incluir el día final completo
              end.setHours(23, 59, 59, 999)
              inRange = inRange && bookingDate <= end
            }
            return inRange
          }
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

  const addHoursToTime = (time: string, hoursToAdd: number) => {
    if (!time) return ''
    const [h, m] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(h, m || 0, 0, 0)
    date.setHours(date.getHours() + (Number(hoursToAdd) || 0))
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }

  const handleCreate = async () => {
    try {
      setCreating(true)
      if (blockOnly) {
        // Reservar un cupo (1 camión) sin cliente: crear una reserva mínima
        const timestamp = Date.now()
        const payload: any = {
          quote_id: `ADMIN-BLOQUEO-${timestamp}`,
          client_name: 'Bloqueo manual (admin)',
          client_email: 'bloqueo+admin@example.com',
          client_phone: '0000000000',
          scheduled_date: newBooking.scheduled_date,
          scheduled_time: newBooking.scheduled_time,
          duration_hours: Number(newBooking.duration_hours) || 4,
          status: 'confirmed',
          payment_type: newBooking.payment_type || null,
          total_price: newBooking.total_price ? Number(newBooking.total_price) : null,
          original_price: newBooking.original_price ? Number(newBooking.original_price) : null,
          origin_address: null,
          destination_address: null,
          notes: newBooking.notes || 'Reserva de cupo sin cliente (admin)'
        }
        const response = await fetch('/api/admin/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err?.error || 'Error al reservar el cupo')
        }
        toast.success('Cupo reservado correctamente (1 camión)')
        setShowAddModal(false)
        setBlockOnly(false)
        setNewBooking({
          quote_id: '', client_name: '', client_email: '', client_phone: '',
          scheduled_date: '', scheduled_time: '', duration_hours: 4, status: 'pending',
          payment_type: '', total_price: '', original_price: '', origin_address: '',
          destination_address: '', notes: ''
        })
        fetchBookings()
        return
      }

      // Crear reserva normal
      const timestamp = Date.now()
      const payload: any = {
        quote_id: newBooking.quote_id || `ADMIN-${timestamp}`,
        client_name: newBooking.client_name,
        client_email: newBooking.client_email,
        client_phone: newBooking.client_phone,
        scheduled_date: newBooking.scheduled_date,
        scheduled_time: newBooking.scheduled_time,
        duration_hours: Number(newBooking.duration_hours) || 4,
        status: newBooking.status,
        payment_type: newBooking.payment_type || null,
        total_price: newBooking.total_price ? Number(newBooking.total_price) : null,
        original_price: newBooking.original_price ? Number(newBooking.original_price) : null,
        origin_address: newBooking.origin_address || null,
        destination_address: newBooking.destination_address || null,
        notes: newBooking.notes || null,
      }

      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || 'Error al crear la reserva')
      }
      toast.success('Reserva creada correctamente')
      setShowAddModal(false)
      setNewBooking({
        quote_id: '', client_name: '', client_email: '', client_phone: '',
        scheduled_date: '', scheduled_time: '', duration_hours: 4, status: 'pending',
        payment_type: '', total_price: '', original_price: '', origin_address: '',
        destination_address: '', notes: ''
      })
      fetchBookings()
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear la reserva')
    } finally {
      setCreating(false)
    }
  }

  const escapeCsvValue = (value: any) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    // Escapar comillas y envolver en comillas si contiene coma, comilla o salto de línea
    const needsQuotes = /[",\n]/.test(str)
    const escaped = str.replace(/"/g, '""')
    return needsQuotes ? `"${escaped}"` : escaped
  }

  const handleExportCSV = () => {
    const headers = [
      'id',
      'quote_id',
      'client_name',
      'client_email',
      'client_phone',
      'scheduled_date',
      'scheduled_time',
      'duration_hours',
      'status',
      'notes',
      'payment_type',
      'total_price',
      'original_price',
      'origin_address',
      'destination_address',
      'created_at',
      'confirmed_at',
      'completed_at',
      'cancelled_at'
    ]

    const rows = filteredBookings.map((b) => headers.map((h) => escapeCsvValue((b as any)[h])).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    link.href = url
    link.download = `reservas_${y}-${m}-${d}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (bookingId: string) => {
    try {
      const ok = confirm('¿Eliminar esta reserva? Esta acción no se puede deshacer.')
      if (!ok) return
      const response = await fetch(`/api/admin/bookings/${bookingId}`, { method: 'DELETE' })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || 'Error al eliminar la reserva')
      }
      toast.success('Reserva eliminada')
      fetchBookings()
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la reserva')
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
        <div className="flex gap-2">
          <Button onClick={fetchBookings} variant="outline" size="sm">
            🔄 Actualizar
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Nueva Reserva
          </Button>
        </div>
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

          <div className={dateFilter === 'range' ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <Select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                if (e.target.value !== 'range') {
                  setCustomStartDate('')
                  setCustomEndDate('')
                }
              }}
              options={[
                { value: 'all', label: 'Todas las fechas' },
                { value: 'today', label: 'Hoy' },
                { value: 'tomorrow', label: 'Mañana' },
                { value: 'week', label: 'Esta semana' },
                { value: 'month', label: 'Este mes' },
                { value: 'range', label: 'Rango personalizado' },
              ]}
            />
            {dateFilter === 'range' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="text-sm min-w-[160px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="text-sm min-w-[160px]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end justify-end">
            <Button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setDateFilter('all')
                setCustomStartDate('')
                setCustomEndDate('')
              }}
              variant="outline"
              size="sm"
              className="whitespace-nowrap px-3"
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
                        {(() => {
                          const [y, m, d] = booking.scheduled_date.split('-').map(Number)
                          const localDate = new Date(y, (m || 1) - 1, d || 1)
                          return format(localDate, 'dd/MM/yyyy', { locale: es })
                        })()}
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
                          <Button
                            onClick={() => handleDelete(booking.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={blockOnly ? 'Bloquear Horario' : 'Nueva Reserva'}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              id="blockOnly"
              type="checkbox"
              checked={blockOnly}
              onChange={(e) => setBlockOnly(e.target.checked)}
            />
            <label htmlFor="blockOnly" className="text-sm text-gray-700">Reservar cupo (1 camión) sin cliente</label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <Input
                type="date"
                value={newBooking.scheduled_date}
                onChange={(e) => setNewBooking({ ...newBooking, scheduled_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <Input
                type="time"
                value={newBooking.scheduled_time}
                onChange={(e) => setNewBooking({ ...newBooking, scheduled_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración (horas)</label>
              <Input
                type="number"
                min="1"
                max="12"
                value={String(newBooking.duration_hours)}
                onChange={(e) => setNewBooking({ ...newBooking, duration_hours: Number(e.target.value) as any })}
              />
            </div>
            {!blockOnly && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <Select
                  value={newBooking.status}
                  onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value })}
                  options={[
                    { value: 'pending', label: 'Pendiente' },
                    { value: 'confirmed', label: 'Confirmado' },
                    { value: 'completed', label: 'Completado' },
                    { value: 'cancelled', label: 'Cancelado' },
                  ]}
                />
              </div>
            )}
          </div>

          {!blockOnly && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Cliente</label>
                <Input
                  type="text"
                  value={newBooking.client_name}
                  onChange={(e) => setNewBooking({ ...newBooking, client_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={newBooking.client_email}
                  onChange={(e) => setNewBooking({ ...newBooking, client_email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <Input
                  type="tel"
                  value={newBooking.client_phone}
                  onChange={(e) => setNewBooking({ ...newBooking, client_phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Cotización (opcional)</label>
                <Input
                  type="text"
                  value={newBooking.quote_id}
                  onChange={(e) => setNewBooking({ ...newBooking, quote_id: e.target.value })}
                />
              </div>
            </div>
          )}

          {!blockOnly && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Origen</label>
                <Input
                  type="text"
                  value={newBooking.origin_address}
                  onChange={(e) => setNewBooking({ ...newBooking, origin_address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Destino</label>
                <Input
                  type="text"
                  value={newBooking.destination_address}
                  onChange={(e) => setNewBooking({ ...newBooking, destination_address: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago</label>
              <Select
                value={newBooking.payment_type}
                onChange={(e) => setNewBooking({ ...newBooking, payment_type: e.target.value })}
                options={[
                  { value: '', label: 'Seleccionar' },
                  { value: 'completo', label: 'Completo' },
                  { value: 'mitad', label: 'Mitad' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Original</label>
              <Input
                type="number"
                value={newBooking.original_price}
                onChange={(e) => setNewBooking({ ...newBooking, original_price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Pagado</label>
              <Input
                type="number"
                value={newBooking.total_price}
                onChange={(e) => setNewBooking({ ...newBooking, total_price: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{blockOnly ? 'Motivo del bloqueo' : 'Notas'}</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={newBooking.notes}
              onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
              placeholder={blockOnly ? 'Ej: Mantención, fuera de servicio, etc.' : 'Detalles de la reserva...'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setShowAddModal(false)} variant="outline">Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? 'Guardando...' : (blockOnly ? 'Bloquear' : 'Crear Reserva')}</Button>
          </div>
        </div>
      </Modal>

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
                  {(() => {
                    const [y, m, d] = selectedBooking.scheduled_date.split('-').map(Number)
                    const localDate = new Date(y, (m || 1) - 1, d || 1)
                    return format(localDate, 'dd/MM/yyyy', { locale: es })
                  })()}
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

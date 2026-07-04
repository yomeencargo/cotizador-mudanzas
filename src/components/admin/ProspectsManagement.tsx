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
  Trash2,
  Clock,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Download,
  UserX,
  MessageSquare,
  MessageCircle,
  Send,
  Users,
  Star,
  Banknote,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import PdfDownloadMenu from './PdfDownloadMenu'
import {
  SOURCE_OPTIONS,
  normalizeOrigin,
  getSourceLabel,
  getSourceBadge,
} from '@/lib/prospectSource'
import type { AdminQuoteData } from '@/lib/adminQuotePdf'
import { normalizeAdminPdfItems } from '@/lib/adminBookingQuoteData'

interface Prospect {
  id: string
  quote_id?: string
  source: string
  name: string
  email: string
  phone: string
  is_company: boolean
  company_name?: string
  company_rut?: string
  origin_address?: string
  destination_address?: string
  visit_address?: string
  scheduled_date?: string
  scheduled_time?: string
  total_price?: number
  original_price?: number
  is_flexible: boolean
  recommended_vehicle?: string
  total_volume?: number
  total_weight?: number
  total_distance?: number
  items_summary?: Array<{ name: string; quantity: number; volume: number }>
  additional_services?: Record<string, any>
  status: 'new' | 'contacted' | 'no_response' | 'converted' | 'lost'
  notes?: string
  converted_booking_id?: string
  pdf_url?: string
  pdf_generated_at?: string
  adjusted_price?: number
  adjustment_comment?: string
  quote_sent_at?: string
  is_frequent?: boolean
  created_at: string
  updated_at: string
}

function prospectToQuoteData(p: Prospect): AdminQuoteData {
  return {
    name: p.name,
    email: p.email,
    phone: p.phone,
    isCompany: p.is_company,
    companyName: p.company_name,
    companyRut: p.company_rut,
    originAddress: p.origin_address,
    destinationAddress: p.destination_address,
    scheduledDate: p.scheduled_date,
    scheduledTime: p.scheduled_time,
    totalPrice: p.adjusted_price ?? p.total_price,
    isFlexible: p.is_flexible,
    recommendedVehicle: p.recommended_vehicle,
    totalVolume: p.total_volume,
    totalWeight: p.total_weight,
    totalDistance: p.total_distance,
    items: normalizeAdminPdfItems(p.items_summary, p.total_volume),
    additionalServices: p.additional_services,
  }
}

export default function ProspectsManagement() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [frequentFilter, setFrequentFilter] = useState('all') // all | yes | no
  const [showConverted, setShowConverted] = useState(false) // incluir prospectos ya convertidos
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [editNotes, setEditNotes] = useState('')
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [quotePrice, setQuotePrice] = useState('')
  const [quoteComment, setQuoteComment] = useState('')
  const [quoteDate, setQuoteDate] = useState('')
  const [quoteTime, setQuoteTime] = useState('')
  const [quoteAlreadyPaid, setQuoteAlreadyPaid] = useState(false)
  const [quotePaymentMethod, setQuotePaymentMethod] = useState<'transferencia' | 'efectivo' | 'otro'>('transferencia')
  const [isSavingAdjust, setIsSavingAdjust] = useState(false)
  const [isSendingQuote, setIsSendingQuote] = useState(false)
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)

  // Los convertidos también se necesitan cuando el filtro de estado es 'converted'
  // (no solo con el checkbox "Ver convertidos").
  const includeConverted = showConverted || statusFilter === 'converted'

  const fetchProspects = async (options: { silent?: boolean } = {}) => {
    try {
      if (!options.silent) setLoading(true)
      const url = includeConverted
        ? '/api/admin/prospects?includeConverted=1'
        : '/api/admin/prospects'
      const response = await fetch(url)
      const data = await response.json()
      setProspects(data)
    } catch (error) {
      console.error('Error fetching prospects:', error)
      if (!options.silent) toast.error('Error al cargar los prospectos')
    } finally {
      if (!options.silent) setLoading(false)
    }
  }

  const filterProspects = useCallback(() => {
    let filtered = [...prospects]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.phone.includes(searchTerm)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(p => normalizeOrigin(p.source) === sourceFilter)
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(p => {
        const created = new Date(p.created_at)
        switch (dateFilter) {
          case 'today':
            return created.toDateString() === now.toDateString()
          case 'week': {
            const weekAgo = new Date(now)
            weekAgo.setDate(weekAgo.getDate() - 7)
            return created >= weekAgo
          }
          case 'month':
            return created.getMonth() === now.getMonth() &&
                   created.getFullYear() === now.getFullYear()
          case 'range': {
            if (!customStartDate && !customEndDate) return true
            if (customStartDate) {
              const [sy, sm, sd] = customStartDate.split('-').map(Number)
              if (created < new Date(sy, (sm || 1) - 1, sd || 1, 0, 0, 0)) return false
            }
            if (customEndDate) {
              const [ey, em, ed] = customEndDate.split('-').map(Number)
              if (created > new Date(ey, (em || 1) - 1, ed || 1, 23, 59, 59)) return false
            }
            return true
          }
          default:
            return true
        }
      })
    }

    if (frequentFilter !== 'all') {
      filtered = filtered.filter(p =>
        frequentFilter === 'yes' ? !!p.is_frequent : !p.is_frequent
      )
    }

    setFilteredProspects(filtered)
  }, [prospects, searchTerm, statusFilter, sourceFilter, dateFilter, customStartDate, customEndDate, frequentFilter])

  useEffect(() => {
    fetchProspects()
    // Refresco silencioso al volver a la pestaña/ventana: así los prospectos que
    // pagaron mientras el panel estaba abierto desaparecen sin refrescar a mano.
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') fetchProspects({ silent: true })
    }
    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnFocus)
    return () => {
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeConverted])

  useEffect(() => {
    filterProspects()
  }, [filterProspects])

  const updateProspectStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (!response.ok) throw new Error('Error al actualizar')
      toast.success('Estado actualizado')
      fetchProspects()
    } catch (error) {
      console.error('Error updating prospect:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const toggleFrequent = async (p: Prospect) => {
    const next = !p.is_frequent
    // Optimista: refleja el cambio al instante en la lista
    setProspects(prev => prev.map(x => (x.id === p.id ? { ...x, is_frequent: next } : x)))
    setSelectedProspect(prev => (prev && prev.id === p.id ? { ...prev, is_frequent: next } : prev))
    try {
      const response = await fetch('/api/admin/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, is_frequent: next }),
      })
      if (!response.ok) throw new Error('Error al actualizar')
      toast.success(next ? 'Marcado como cliente frecuente' : 'Quitado de clientes frecuentes')
    } catch (error) {
      console.error('Error toggling frequent:', error)
      toast.error('No se pudo actualizar. Reintenta.')
      // Revertir si falló
      setProspects(prev => prev.map(x => (x.id === p.id ? { ...x, is_frequent: !next } : x)))
      setSelectedProspect(prev => (prev && prev.id === p.id ? { ...prev, is_frequent: !next } : prev))
    }
  }

  const saveNotes = async () => {
    if (!selectedProspect) return
    try {
      const response = await fetch('/api/admin/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProspect.id, notes: editNotes }),
      })

      if (!response.ok) throw new Error('Error al guardar')
      toast.success('Notas guardadas')
      setShowNotesModal(false)
      fetchProspects()
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Error al guardar las notas')
    }
  }

  // Normaliza un teléfono chileno a formato internacional para wa.me (solo dígitos, con 56)
  const normalizePhoneCL = (raw?: string) => {
    const digits = (raw || '').replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('56')) return digits
    if (digits.length === 9 && digits.startsWith('9')) return '56' + digits
    if (digits.length === 8) return '569' + digits
    return '56' + digits
  }

  const buildWhatsappLink = (p: Prospect) => {
    const phone = normalizePhoneCL(p.phone)
    const price = p.adjusted_price ?? p.total_price
    const precioTxt = price ? ` por $${price.toLocaleString('es-CL')}` : ''
    const firstName = p.name?.split(' ')[0] || ''
    // Incluir fecha/hora de la cotización si el prospecto las tiene
    let cuando = ''
    if (p.scheduled_date) {
      const [y, m, d] = p.scheduled_date.split('-').map(Number)
      const fechaTxt = format(new Date(y, (m || 1) - 1, d || 1), "d 'de' MMMM", { locale: es })
      cuando = ` para el ${fechaTxt}${p.scheduled_time ? ` a las ${p.scheduled_time.slice(0, 5)}` : ''}`
    }
    const msg = `Hola ${firstName}, te contacto de Yo me Encargo por tu cotización de mudanza${cuando}${precioTxt}. ¿Cómo estás? Quería coordinar contigo los detalles para asegurar tu fecha.`
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  // Contacto por WhatsApp: reutiliza una sola ventana (no abre pestaña nueva cada
  // vez) y marca el prospecto como "contactado" si todavía estaba en "nuevo".
  const contactWhatsApp = (p: Prospect) => {
    window.open(buildWhatsappLink(p), 'whatsapp_yme')
    if (p.status === 'new') {
      void updateProspectStatus(p.id, 'contacted')
    }
  }

  const openQuoteModal = (p: Prospect) => {
    setSelectedProspect(p)
    setQuotePrice(String(p.adjusted_price ?? p.total_price ?? ''))
    setQuoteComment(p.adjustment_comment || '')
    setQuoteDate(p.scheduled_date || '')
    setQuoteTime(p.scheduled_time ? p.scheduled_time.slice(0, 5) : '')
    setQuoteAlreadyPaid(false)
    setQuotePaymentMethod('transferencia')
    setShowQuoteModal(true)
  }

  const saveAdjustment = async () => {
    if (!selectedProspect) return
    const price = quotePrice === '' ? null : Math.round(Number(quotePrice))
    if (price !== null && (!Number.isFinite(price) || price <= 0)) {
      toast.error('Precio inválido')
      return
    }
    try {
      setIsSavingAdjust(true)
      const response = await fetch('/api/admin/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProspect.id,
          adjusted_price: price,
          adjustment_comment: quoteComment,
          scheduled_date: quoteDate || null,
          scheduled_time: quoteTime || null,
        }),
      })
      if (!response.ok) throw new Error('Error al guardar el ajuste')
      toast.success('Ajuste guardado')
      fetchProspects()
    } catch (error) {
      console.error('Error saving adjustment:', error)
      toast.error('No se pudo guardar el ajuste')
    } finally {
      setIsSavingAdjust(false)
    }
  }

  const sendAdjustedQuote = async () => {
    if (!selectedProspect) return
    const price = quotePrice === '' ? null : Math.round(Number(quotePrice))
    if (price === null || !Number.isFinite(price) || price <= 0) {
      toast.error('Ingresa un precio válido antes de enviar')
      return
    }
    try {
      setIsSendingQuote(true)
      const response = await fetch('/api/admin/prospects/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: selectedProspect.id,
          price,
          comment: quoteComment,
          date: quoteDate || undefined,
          time: quoteTime || undefined,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo enviar la cotización')
      }
      toast.success('Cotización enviada por correo (50% y 100%)')
      setShowQuoteModal(false)
      fetchProspects()
    } catch (error) {
      console.error('Error sending adjusted quote:', error)
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la cotización')
    } finally {
      setIsSendingQuote(false)
    }
  }

  const createBookingFromProspect = async () => {
    if (!selectedProspect) return
    const price = quotePrice === '' ? null : Math.round(Number(quotePrice))
    if (price === null || !Number.isFinite(price) || price <= 0) {
      toast.error('Ingresa un precio válido')
      return
    }
    if (!quoteDate || !quoteTime) {
      toast.error('Agrega fecha y hora para crear la reserva')
      return
    }
    const paidNote = quoteAlreadyPaid ? ` Se registrará como PAGADA (${quotePaymentMethod}).` : ''
    if (!confirm(`¿Crear una reserva confirmada para ${selectedProspect.name} el ${quoteDate} a las ${quoteTime} por $${price.toLocaleString('es-CL')}? Esta reserva ocupará cupo.${paidNote}`)) return
    try {
      setIsCreatingBooking(true)
      const response = await fetch('/api/admin/prospects/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: selectedProspect.id,
          price,
          comment: quoteComment,
          date: quoteDate,
          time: quoteTime,
          paid: quoteAlreadyPaid,
          paymentMethod: quoteAlreadyPaid ? quotePaymentMethod : undefined,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo crear la reserva')
      }
      toast.success('Reserva creada y prospecto convertido')
      setShowQuoteModal(false)
      fetchProspects()
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error(error instanceof Error ? error.message : 'No se pudo crear la reserva')
    } finally {
      setIsCreatingBooking(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este prospecto? Esta acción no se puede deshacer.')) return
    try {
      const response = await fetch(`/api/admin/prospects?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Error al eliminar')
      toast.success('Prospecto eliminado')
      fetchProspects()
    } catch (error) {
      console.error('Error deleting prospect:', error)
      toast.error('Error al eliminar el prospecto')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'contacted': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'no_response': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'converted': return 'text-green-600 bg-green-50 border-green-200'
      case 'lost': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nuevo'
      case 'contacted': return 'Contactado'
      case 'no_response': return 'Sin respuesta'
      case 'converted': return 'Convertido'
      case 'lost': return 'Perdido'
      default: return status
    }
  }

  // SOURCE_OPTIONS, normalizeOrigin, getSourceLabel, getSourceBadge se importan desde
  // '@/lib/prospectSource' (compartidos con el panel de Reservas).

  const updateProspectSource = async (id: string, newSource: string) => {
    try {
      const response = await fetch('/api/admin/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, source: newSource }),
      })
      if (!response.ok) throw new Error('Error al actualizar')
      toast.success('Origen actualizado')
      setSelectedProspect(prev => (prev && prev.id === id ? { ...prev, source: newSource } : prev))
      fetchProspects()
    } catch (error) {
      console.error('Error updating source:', error)
      toast.error('No se pudo actualizar el origen')
    }
  }

  const escapeCsvValue = (value: any) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    const needsQuotes = /[",\n]/.test(str)
    const escaped = str.replace(/"/g, '""')
    return needsQuotes ? `"${escaped}"` : escaped
  }

  const handleExportCSV = () => {
    const headers = ['name', 'email', 'phone', 'source', 'status', 'total_price', 'origin_address', 'destination_address', 'visit_address', 'notes', 'created_at']
    const rows = filteredProspects.map(p => headers.map(h => escapeCsvValue((p as any)[h])).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const now = new Date()
    link.href = url
    link.download = `prospectos_${format(now, 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Estadísticas rápidas
  const statsNew = prospects.filter(p => p.status === 'new').length
  const statsContacted = prospects.filter(p => p.status === 'contacted').length
  const statsNoResponse = prospects.filter(p => p.status === 'no_response').length
  const statsLost = prospects.filter(p => p.status === 'lost').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando prospectos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-archivo font-extrabold tracking-tight text-gray-900">Prospectos / Leads</h2>
          <p className="text-sm text-gray-500">
            {filteredProspects.length} de {prospects.length} prospectos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchProspects()} variant="outline" size="sm">
            Actualizar
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Nuevos</p>
              <p className="text-2xl font-archivo font-extrabold text-blue-600">{statsNew}</p>
            </div>
            <div className="p-2.5 rounded-full bg-blue-50">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Contactados</p>
              <p className="text-2xl font-archivo font-extrabold text-yellow-600">{statsContacted}</p>
            </div>
            <div className="p-2.5 rounded-full bg-yellow-50">
              <Phone className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Sin respuesta</p>
              <p className="text-2xl font-archivo font-extrabold text-orange-600">{statsNoResponse}</p>
            </div>
            <div className="p-2.5 rounded-full bg-orange-50">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Perdidos</p>
              <p className="text-2xl font-archivo font-extrabold text-red-600">{statsLost}</p>
            </div>
            <div className="p-2.5 rounded-full bg-red-50">
              <UserX className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Nombre, email, tel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
            <Select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              options={[{ value: 'all', label: 'Todos' }, ...SOURCE_OPTIONS]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'new', label: 'Nuevo' },
                { value: 'contacted', label: 'Contactado' },
                { value: 'no_response', label: 'Sin respuesta' },
                { value: 'lost', label: 'Perdido' },
                { value: 'converted', label: 'Convertido (pagado)' },
              ]}
            />
          </div>

          <div className={dateFilter === 'range' ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
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
                { value: 'all', label: 'Todas' },
                { value: 'today', label: 'Hoy' },
                { value: 'week', label: 'Última semana' },
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
                    className="text-sm min-w-[150px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="text-sm min-w-[150px]"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frecuentes</label>
            <Select
              value={frequentFilter}
              onChange={(e) => setFrequentFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'yes', label: 'Solo frecuentes' },
                { value: 'no', label: 'No frecuentes' },
              ]}
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 pb-2" title="Incluir prospectos ya convertidos en reserva">
              <input
                type="checkbox"
                checked={showConverted}
                onChange={(e) => setShowConverted(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
              />
              Ver convertidos
            </label>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setSourceFilter('all')
                setDateFilter('all')
                setCustomStartDate('')
                setCustomEndDate('')
                setFrequentFilter('all')
                setShowConverted(false)
              }}
              variant="outline"
              size="sm"
              className="whitespace-nowrap px-3"
            >
              <Filter className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {filteredProspects.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron prospectos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Est.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProspects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-900">{prospect.name}</span>
                        {prospect.is_frequent && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> Frecuente
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{prospect.email}</div>
                      <div className="text-xs text-gray-400">{prospect.phone}</div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 align-top whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSourceBadge(prospect.source)}`}>
                        {getSourceLabel(prospect.source)}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 align-top whitespace-nowrap">
                      {prospect.total_price ? (
                        <span className="text-sm font-semibold text-green-700">
                          ${prospect.total_price.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(prospect.status)}`}>
                        {getStatusLabel(prospect.status)}
                      </span>
                      {prospect.status === 'converted' && prospect.converted_booking_id && (
                        <div className="text-[11px] text-green-700 mt-1" title={`Reserva ${prospect.converted_booking_id}`}>
                          → en Reservas
                        </div>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 align-top whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(prospect.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button
                            onClick={() => {
                              setSelectedProspect(prospect)
                              setShowDetailsModal(true)
                            }}
                            variant="outline"
                            size="sm"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => toggleFrequent(prospect)}
                            variant="outline"
                            size="sm"
                            className={prospect.is_frequent
                              ? 'text-amber-600 border-amber-300 bg-amber-50 hover:bg-amber-100'
                              : 'text-gray-400 border-gray-200 hover:bg-gray-50'}
                            title={prospect.is_frequent ? 'Quitar de clientes frecuentes' : 'Marcar como cliente frecuente'}
                          >
                            <Star className={`w-4 h-4 ${prospect.is_frequent ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </Button>
                          <Button
                            onClick={() => contactWhatsApp(prospect)}
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            title="Contactar por WhatsApp (marca como contactado)"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => openQuoteModal(prospect)}
                            variant="outline"
                            size="sm"
                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            title="Ajustar y enviar cotización por correo"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          {prospect.status !== 'converted' && (
                            <Button
                              onClick={() => openQuoteModal(prospect)}
                              variant="outline"
                              size="sm"
                              className="text-blue-700 border-blue-200 hover:bg-blue-50"
                              title="Convertir en reserva (pago por transferencia o efectivo, sin pasar por Flow)"
                            >
                              <Banknote className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => {
                              setSelectedProspect(prospect)
                              setEditNotes(prospect.notes || '')
                              setShowNotesModal(true)
                            }}
                            variant="outline"
                            size="sm"
                            title="Notas"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <PdfDownloadMenu
                            data={prospectToQuoteData(prospect)}
                            compact
                          />
                          <Button
                            onClick={() => handleDelete(prospect.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {prospect.status === 'new' && (
                          <Button
                            onClick={() => updateProspectStatus(prospect.id, 'contacted')}
                            variant="outline"
                            size="sm"
                            className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                          >
                            Marcar contactado
                          </Button>
                        )}
                        {(prospect.status === 'contacted' || prospect.status === 'no_response') && (
                          <div className="flex gap-1 flex-wrap">
                            {prospect.status === 'contacted' && (
                              <Button
                                onClick={() => updateProspectStatus(prospect.id, 'no_response')}
                                variant="outline"
                                size="sm"
                                className="text-xs bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                              >
                                Sin respuesta
                              </Button>
                            )}
                            {prospect.status === 'no_response' && (
                              <Button
                                onClick={() => updateProspectStatus(prospect.id, 'contacted')}
                                variant="outline"
                                size="sm"
                                className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                              >
                                Reintentar
                              </Button>
                            )}
                            <Button
                              onClick={() => updateProspectStatus(prospect.id, 'lost')}
                              variant="outline"
                              size="sm"
                              className="text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            >
                              Perdido
                            </Button>
                          </div>
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
        title="Detalle del Prospecto"
        size="lg"
      >
        {selectedProspect && (
          <div className="space-y-4">
            {/* Estado y source */}
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedProspect.status)}`}>
                {getStatusLabel(selectedProspect.status)}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSourceBadge(selectedProspect.source)}`}>
                {getSourceLabel(selectedProspect.source)}
              </span>
              <span className="text-sm text-gray-500">
                {format(new Date(selectedProspect.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
              </span>
            </div>

            {/* Origen editable (CRM) */}
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">Origen del lead</label>
              <Select
                value={normalizeOrigin(selectedProspect.source)}
                onChange={(e) => updateProspectSource(selectedProspect.id, e.target.value)}
                options={SOURCE_OPTIONS}
              />
              <p className="text-xs text-gray-500 mt-1">Cámbialo a Web, RRSS, Recomendación o Cliente antiguo según de dónde vino.</p>
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <p className="text-sm text-gray-900">{selectedProspect.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{selectedProspect.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <p className="text-sm text-gray-900">{selectedProspect.phone}</p>
              </div>
              {selectedProspect.is_company && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Empresa</label>
                  <p className="text-sm text-gray-900">
                    {selectedProspect.company_name} (RUT: {selectedProspect.company_rut})
                  </p>
                </div>
              )}
            </div>

            {/* Precio */}
            {selectedProspect.total_price && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <label className="text-sm font-medium text-green-900">Precio Estimado</label>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  ${selectedProspect.total_price.toLocaleString()}
                </p>
                {selectedProspect.is_flexible && (
                  <p className="text-xs text-green-600 mt-1">Con descuento por flexibilidad</p>
                )}
              </div>
            )}

            {/* Direcciones */}
            {(selectedProspect.origin_address || selectedProspect.destination_address || selectedProspect.visit_address) && (
              <div className="space-y-3">
                {selectedProspect.origin_address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-blue-600" /> Origen
                    </label>
                    <p className="text-sm text-gray-900">{selectedProspect.origin_address}</p>
                  </div>
                )}
                {selectedProspect.destination_address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-green-600" /> Destino
                    </label>
                    <p className="text-sm text-gray-900">{selectedProspect.destination_address}</p>
                  </div>
                )}
                {selectedProspect.visit_address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-purple-600" /> Dirección de Visita
                    </label>
                    <p className="text-sm text-gray-900">{selectedProspect.visit_address}</p>
                  </div>
                )}
              </div>
            )}

            {/* Fecha programada */}
            {selectedProspect.scheduled_date && (
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-primary-600" /> Fecha y Hora
                </label>
                <p className="text-sm text-gray-900">
                  {(() => {
                    const [y, m, d] = selectedProspect.scheduled_date.split('-').map(Number)
                    const localDate = new Date(y, (m || 1) - 1, d || 1)
                    return format(localDate, 'dd/MM/yyyy', { locale: es })
                  })()}
                  {selectedProspect.scheduled_time && ` a las ${selectedProspect.scheduled_time}`}
                </p>
              </div>
            )}

            {/* Detalles de mudanza */}
            {(selectedProspect.total_volume || selectedProspect.total_distance || selectedProspect.recommended_vehicle) && (
              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                {selectedProspect.total_volume && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Volumen</p>
                    <p className="font-bold">{selectedProspect.total_volume} m3</p>
                  </div>
                )}
                {selectedProspect.total_distance && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Distancia</p>
                    <p className="font-bold">{selectedProspect.total_distance} km</p>
                  </div>
                )}
                {selectedProspect.recommended_vehicle && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Vehículo</p>
                    <p className="font-bold">{selectedProspect.recommended_vehicle}</p>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            {selectedProspect.items_summary && selectedProspect.items_summary.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Items Cotizados</label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedProspect.items_summary.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm bg-gray-50 px-3 py-1 rounded">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="text-gray-500">{item.volume} m3</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Servicios adicionales */}
            {selectedProspect.additional_services && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Servicios Adicionales</label>
                <div className="flex flex-wrap gap-2">
                  {selectedProspect.additional_services.disassembly && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Desarme</span>
                  )}
                  {selectedProspect.additional_services.assembly && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Armado</span>
                  )}
                  {selectedProspect.additional_services.packing && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Embalaje</span>
                  )}
                  {selectedProspect.additional_services.unpacking && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Desembalaje</span>
                  )}
                  {selectedProspect.additional_services.observations && (
                    <p className="text-sm text-gray-600 w-full mt-1">
                      Obs: {selectedProspect.additional_services.observations}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* PDF */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="block text-sm font-medium text-green-900 mb-1">
                    PDF de Cotización
                  </label>
                  <p className="text-xs text-green-700">
                    Elige la versión con precios (cliente) o sin precios (trabajadores).
                  </p>
                </div>
                <PdfDownloadMenu
                  data={prospectToQuoteData(selectedProspect)}
                />
              </div>
            </div>

            {/* Notas */}
            {selectedProspect.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-yellow-900 mb-1">Notas</label>
                <p className="text-sm text-yellow-800">{selectedProspect.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              {selectedProspect.pdf_url && (
                <Button
                  onClick={() => window.open(selectedProspect.pdf_url, '_blank')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </Button>
              )}
              <Button onClick={() => setShowDetailsModal(false)} variant="outline">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notes Modal */}
      <Modal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        title={`Notas - ${selectedProspect?.name || ''}`}
      >
        <div className="space-y-4">
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={5}
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Agregar notas sobre este prospecto..."
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowNotesModal(false)} variant="outline">
              Cancelar
            </Button>
            <Button onClick={saveNotes}>
              Guardar Notas
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quote / Adjust Modal */}
      <Modal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        title={`Cotización - ${selectedProspect?.name || ''}`}
        size="lg"
      >
        {selectedProspect && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Precio cotizado originalmente:{' '}
              <span className="font-semibold text-gray-900">
                ${(selectedProspect.total_price || 0).toLocaleString('es-CL')}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio final (ajustado)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  min="0"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  className="pl-9"
                  placeholder="Ej: 240000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Aumenta o baja el precio según corresponda. Se enviarán ambos links de pago.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <Input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <Input type="time" value={quoteTime} onChange={(e) => setQuoteTime(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F2FBE9] border border-[#8CC63F] rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">Abono 50%</p>
                <p className="text-lg font-bold text-[#3F6212]">
                  ${Math.round((Number(quotePrice) || 0) * 0.5).toLocaleString('es-CL')}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">Pago 100% (5% dcto)</p>
                <p className="text-lg font-bold text-gray-900">
                  ${Math.round((Number(quotePrice) || 0) * 0.95).toLocaleString('es-CL')}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentario de ajuste (se incluye en el correo)
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={quoteComment}
                onChange={(e) => setQuoteComment(e.target.value)}
                placeholder="Ej: Ajustamos el valor por piso sin ascensor y volumen adicional..."
              />
            </div>

            {selectedProspect.quote_sent_at && (
              <p className="text-xs text-gray-500">
                Última cotización enviada:{' '}
                {format(new Date(selectedProspect.quote_sent_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
              </p>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={quoteAlreadyPaid}
                  onChange={(e) => setQuoteAlreadyPaid(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Cliente ya pagó (transferencia / efectivo)
              </label>
              {quoteAlreadyPaid && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Medio de pago</label>
                  <Select
                    value={quotePaymentMethod}
                    onChange={(e) => setQuotePaymentMethod(e.target.value as 'transferencia' | 'efectivo' | 'otro')}
                    options={[
                      { value: 'transferencia', label: 'Transferencia' },
                      { value: 'efectivo', label: 'Efectivo' },
                      { value: 'otro', label: 'Otro' },
                    ]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Al crear la reserva quedará marcada como pagada de inmediato (no aparecerá &ldquo;Pago pendiente&rdquo;).
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
              <Button onClick={() => setShowQuoteModal(false)} variant="outline">
                Cerrar
              </Button>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={saveAdjustment} variant="outline" isLoading={isSavingAdjust}>
                  Guardar ajuste
                </Button>
                <Button
                  onClick={createBookingFromProspect}
                  isLoading={isCreatingBooking}
                  className="bg-secondary-600 hover:bg-secondary-700"
                  title={
                    quoteAlreadyPaid
                      ? `Crear reserva confirmada y pagada (${quotePaymentMethod})`
                      : 'Crear reserva confirmada, sin pago online (quedará "Pago pendiente")'
                  }
                >
                  {quoteAlreadyPaid ? 'Crear reserva pagada' : 'Crear reserva'}
                </Button>
                <Button onClick={sendAdjustedQuote} isLoading={isSendingQuote}>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar por correo
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

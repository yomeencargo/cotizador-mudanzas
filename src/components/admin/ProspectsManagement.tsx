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
  UserCheck,
  UserX,
  MessageSquare,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

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
  status: 'new' | 'contacted' | 'converted' | 'lost'
  notes?: string
  converted_booking_id?: string
  pdf_url?: string
  pdf_generated_at?: string
  created_at: string
  updated_at: string
}

export default function ProspectsManagement() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [editNotes, setEditNotes] = useState('')

  const fetchProspects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/prospects')
      const data = await response.json()
      setProspects(data)
    } catch (error) {
      console.error('Error fetching prospects:', error)
      toast.error('Error al cargar los prospectos')
    } finally {
      setLoading(false)
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
      filtered = filtered.filter(p => p.source === sourceFilter)
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
          default:
            return true
        }
      })
    }

    setFilteredProspects(filtered)
  }, [prospects, searchTerm, statusFilter, sourceFilter, dateFilter])

  useEffect(() => {
    fetchProspects()
  }, [])

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
      case 'converted': return 'text-green-600 bg-green-50 border-green-200'
      case 'lost': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nuevo'
      case 'contacted': return 'Contactado'
      case 'converted': return 'Convertido'
      case 'lost': return 'Perdido'
      default: return status
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'web': return 'Web'
      case 'pdf_download': return 'PDF'
      case 'email_quote': return 'Email'
      case 'checkout_initiated': return 'Checkout'
      case 'domicilio': return 'Domicilio'
      default: return source
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'pdf_download': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'email_quote': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      case 'checkout_initiated': return 'bg-green-100 text-green-800 border-green-200'
      case 'domicilio': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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
  const statsConverted = prospects.filter(p => p.status === 'converted').length
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
          <h2 className="text-2xl font-bold text-gray-900">Prospectos / Leads</h2>
          <p className="text-gray-600">
            {filteredProspects.length} de {prospects.length} prospectos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchProspects} variant="outline" size="sm">
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
              <p className="text-2xl font-bold text-blue-600">{statsNew}</p>
            </div>
            <Users className="w-6 h-6 text-blue-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Contactados</p>
              <p className="text-2xl font-bold text-yellow-600">{statsContacted}</p>
            </div>
            <Phone className="w-6 h-6 text-yellow-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Convertidos</p>
              <p className="text-2xl font-bold text-green-600">{statsConverted}</p>
            </div>
            <UserCheck className="w-6 h-6 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Perdidos</p>
              <p className="text-2xl font-bold text-red-600">{statsLost}</p>
            </div>
            <UserX className="w-6 h-6 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'pdf_download', label: 'Descarga PDF' },
                { value: 'email_quote', label: 'Email' },
                { value: 'checkout_initiated', label: 'Checkout' },
                { value: 'domicilio', label: 'Domicilio' },
                { value: 'web', label: 'Web' },
              ]}
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
                { value: 'converted', label: 'Convertido' },
                { value: 'lost', label: 'Perdido' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todas' },
                { value: 'today', label: 'Hoy' },
                { value: 'week', label: 'Última semana' },
                { value: 'month', label: 'Este mes' },
              ]}
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setSourceFilter('all')
                setDateFilter('all')
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Est.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProspects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{prospect.name}</div>
                      <div className="text-sm text-gray-500">{prospect.email}</div>
                      <div className="text-xs text-gray-400">{prospect.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSourceBadge(prospect.source)}`}>
                        {getSourceLabel(prospect.source)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {prospect.total_price ? (
                        <span className="text-sm font-semibold text-green-700">
                          ${prospect.total_price.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(prospect.status)}`}>
                        {getStatusLabel(prospect.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(prospect.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
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
                          {prospect.pdf_url && (
                            <Button
                              onClick={() => window.open(prospect.pdf_url, '_blank')}
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              title="Ver PDF de Cotización"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
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
                        {prospect.status === 'contacted' && (
                          <div className="flex gap-1">
                            <Button
                              onClick={() => updateProspectStatus(prospect.id, 'converted')}
                              variant="outline"
                              size="sm"
                              className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            >
                              Convertido
                            </Button>
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
            {selectedProspect.pdf_url ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-green-900 mb-1">
                      PDF de Cotización
                    </label>
                    <p className="text-xs text-green-700">
                      Generado el {selectedProspect.pdf_generated_at
                        ? format(new Date(selectedProspect.pdf_generated_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })
                        : 'N/A'}
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open(selectedProspect.pdf_url, '_blank')}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Ver PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  PDF de Cotización
                </label>
                <p className="text-xs text-gray-600">
                  Aún no hay PDF asociado. Suele generarse al llegar al resumen del cotizador; también
                  puede guardarse al usar «Descargar PDF» o «Descargar cotización confirmada». Si cerró
                  la página muy rápido, falló la red o faltaban datos en el resumen, puede no haberse
                  completado la subida.
                </p>
              </div>
            )}

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
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import BookingsManagement from '@/components/admin/BookingsManagement'
import FleetManagement from '@/components/admin/FleetManagement'
import ScheduleManagement from '@/components/admin/ScheduleManagement'
import PricingConfiguration from '@/components/admin/PricingConfiguration'
import ScheduleConfiguration from '@/components/admin/ScheduleConfiguration'
import ItemsManagement from '@/components/admin/ItemsManagement'
import { 
  Calendar, 
  Truck, 
  Clock, 
  BarChart3, 
  Settings, 
  Users, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  LogOut,
  Package
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface DashboardStats {
  todayBookings: number
  monthlyRevenue: number
  pendingBookings: number
  totalVehicles: number
  occupancyRate: number
  averageTicket: number
}

interface TodayBooking {
  id: string
  client_name: string
  client_phone: string
  scheduled_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  estimated_price: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activeSettingsTab, setActiveSettingsTab] = useState('pricing')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Sesión cerrada correctamente')
        router.push('/admin/login')
      } else {
        toast.error('Error al cerrar sesión')
      }
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Error al cerrar sesión')
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch stats
      const statsResponse = await fetch('/api/admin/stats')
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch today's bookings
      const bookingsResponse = await fetch('/api/admin/today-bookings')
      const bookingsData = await bookingsResponse.json()
      setTodayBookings(bookingsData)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'bookings', name: 'Reservas', icon: Calendar },
    { id: 'fleet', name: 'Flota', icon: Truck },
    { id: 'schedule', name: 'Horarios', icon: Clock },
    { id: 'reports', name: 'Reportes', icon: TrendingUp },
    { id: 'settings', name: 'Configuración', icon: Settings },
  ]

  const settingsTabs = [
    { id: 'pricing', name: 'Precios', icon: DollarSign },
    { id: 'schedule-config', name: 'Horarios', icon: Clock },
    { id: 'inventory', name: 'Inventario', icon: Package },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'completed': return 'text-blue-600 bg-blue-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-sm text-gray-600">Gestión de mudanzas y reservas</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                size="sm"
              >
                ← Volver al Cotizador
              </Button>
              <Button
                onClick={fetchDashboardData}
                variant="secondary"
                size="sm"
              >
                🔄 Actualizar
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Reservas Hoy</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.todayBookings || 0}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-primary-600" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-green-600 font-semibold">
                    +12% vs ayer
                  </span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${stats?.monthlyRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-green-600 font-semibold">
                    +8% vs mes anterior
                  </span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.pendingBookings || 0}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-yellow-600 font-semibold">
                    Requieren atención
                  </span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ocupación</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.occupancyRate || 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-blue-600 font-semibold">
                    Promedio diario
                  </span>
                </div>
              </Card>
            </div>

            {/* Today's Bookings */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Reservas de Hoy ({format(new Date(), 'dd/MM/yyyy', { locale: es })})
                </h3>
                <Button
                  onClick={() => setActiveTab('bookings')}
                  variant="outline"
                  size="sm"
                >
                  Ver Todas
                </Button>
              </div>

              {todayBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay reservas para hoy</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {booking.client_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.client_phone} • {booking.scheduled_time}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${booking.estimated_price?.toLocaleString() || 'N/A'}
                        </p>
                        <p className={`text-xs font-medium capitalize ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones Rápidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setActiveTab('schedule')}
                  className="h-16 flex-col gap-2"
                  variant="outline"
                >
                  <Clock className="w-6 h-6" />
                  Bloquear Horario
                </Button>
                <Button
                  onClick={() => setActiveTab('fleet')}
                  className="h-16 flex-col gap-2"
                  variant="outline"
                >
                  <Truck className="w-6 h-6" />
                  Configurar Flota
                </Button>
                <Button
                  onClick={() => setActiveTab('reports')}
                  className="h-16 flex-col gap-2"
                  variant="outline"
                >
                  <BarChart3 className="w-6 h-6" />
                  Ver Reportes
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && <BookingsManagement />}

        {/* Fleet Tab */}
        {activeTab === 'fleet' && <FleetManagement />}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && <ScheduleManagement />}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <Card className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <BarChart3 className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reportes y Estadísticas
            </h3>
            <p className="text-gray-600 mb-4">
              Esta sección se implementará próximamente
            </p>
            <Button
              onClick={() => setActiveTab('dashboard')}
              variant="outline"
            >
              Volver al Dashboard
            </Button>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Settings Sub-tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${activeSettingsTab === tab.id
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Settings Content */}
            {activeSettingsTab === 'pricing' && <PricingConfiguration />}
            {activeSettingsTab === 'schedule-config' && <ScheduleConfiguration />}
            {activeSettingsTab === 'inventory' && <ItemsManagement />}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-12 py-6 border-t border-gray-200">
        <p className="text-xs text-gray-400">
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
    </div>
  )
}

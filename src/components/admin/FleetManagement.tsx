'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Truck, Plus, Minus, Save, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface FleetConfig {
  id: string
  num_vehicles: number
  updated_at: string
}

interface Vehicle {
  id: number
  name: string
  capacity: number
  status: 'active' | 'maintenance' | 'inactive'
  driver?: string
  phone?: string
}

export default function FleetManagement() {
  const [fleetConfig, setFleetConfig] = useState<FleetConfig | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    capacity: 1,
    driver: '',
    phone: ''
  })

  useEffect(() => {
    fetchFleetData()
  }, [])

  const fetchFleetData = async () => {
    try {
      setLoading(true)
      
      // Obtener configuración de flota
      const configResponse = await fetch('/api/admin/fleet-config')
      const configData = await configResponse.json()
      setFleetConfig(configData)

      // Obtener vehículos (simulado por ahora)
      const mockVehicles: Vehicle[] = Array.from({ length: configData.num_vehicles }, (_, i) => ({
        id: i + 1,
        name: `Camión ${i + 1}`,
        capacity: 1,
        status: 'active' as const,
        driver: `Conductor ${i + 1}`,
        phone: `+5691234567${i}`
      }))
      setVehicles(mockVehicles)

    } catch (error) {
      console.error('Error fetching fleet data:', error)
      toast.error('Error al cargar la configuración de flota')
    } finally {
      setLoading(false)
    }
  }

  const updateFleetSize = async (newSize: number) => {
    if (newSize < 1) {
      toast.error('Debe tener al menos 1 vehículo')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/fleet-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_vehicles: newSize })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar la configuración')
      }

      const updatedConfig = await response.json()
      setFleetConfig(updatedConfig)

      // Actualizar lista de vehículos
      const updatedVehicles = Array.from({ length: newSize }, (_, i) => {
        const existingVehicle = vehicles[i]
        return existingVehicle || {
          id: i + 1,
          name: `Camión ${i + 1}`,
          capacity: 1,
          status: 'active' as const,
          driver: `Conductor ${i + 1}`,
          phone: `+5691234567${i}`
        }
      })
      setVehicles(updatedVehicles)

      toast.success('Configuración de flota actualizada')
    } catch (error) {
      console.error('Error updating fleet config:', error)
      toast.error('Error al actualizar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const addVehicle = async () => {
    if (!newVehicle.name.trim()) {
      toast.error('El nombre del vehículo es requerido')
      return
    }

    // Actualizar la configuración de flota en la BD
    const newFleetSize = vehicles.length + 1
    try {
      const response = await fetch('/api/admin/fleet-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_vehicles: newFleetSize })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar la configuración')
      }

      // Actualizar estado local
      const vehicle: Vehicle = {
        id: vehicles.length + 1,
        name: newVehicle.name,
        capacity: newVehicle.capacity,
        status: 'active',
        driver: newVehicle.driver,
        phone: newVehicle.phone
      }

      setVehicles([...vehicles, vehicle])
      setFleetConfig(prev => prev ? { ...prev, num_vehicles: newFleetSize } : null)
      setNewVehicle({ name: '', capacity: 1, driver: '', phone: '' })
      setShowAddVehicle(false)
      toast.success('Vehículo agregado y configuración actualizada')
    } catch (error) {
      console.error('Error adding vehicle:', error)
      toast.error('Error al agregar el vehículo')
    }
  }

  const removeVehicle = async (vehicleId: number) => {
    if (vehicles.length <= 1) {
      toast.error('Debe tener al menos 1 vehículo')
      return
    }

    const newFleetSize = vehicles.length - 1
    try {
      const response = await fetch('/api/admin/fleet-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_vehicles: newFleetSize })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar la configuración')
      }

      setVehicles(vehicles.filter(v => v.id !== vehicleId))
      setFleetConfig(prev => prev ? { ...prev, num_vehicles: newFleetSize } : null)
      toast.success('Vehículo eliminado y configuración actualizada')
    } catch (error) {
      console.error('Error removing vehicle:', error)
      toast.error('Error al eliminar el vehículo')
    }
  }

  const updateVehicleStatus = (vehicleId: number, status: Vehicle['status']) => {
    setVehicles(vehicles.map(v => 
      v.id === vehicleId ? { ...v, status } : v
    ))
    toast.success('Estado del vehículo actualizado')
  }

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200'
      case 'maintenance': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'inactive': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: Vehicle['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'maintenance': return <AlertCircle className="w-4 h-4" />
      case 'inactive': return <AlertCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración de flota...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración de Flota</h2>
          <p className="text-gray-600">Gestiona tus vehículos y capacidad</p>
        </div>
        <Button onClick={fetchFleetData} variant="outline" size="sm">
          🔄 Actualizar
        </Button>
      </div>

      {/* Fleet Size Configuration */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tamaño de la Flota</h3>
            <p className="text-sm text-gray-600">
              Ajusta el número total de vehículos disponibles
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => updateFleetSize((fleetConfig?.num_vehicles || 1) - 1)}
                variant="outline"
                size="sm"
                disabled={saving || (fleetConfig?.num_vehicles || 1) <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">
                {fleetConfig?.num_vehicles || 1}
              </span>
              <Button
                onClick={() => updateFleetSize((fleetConfig?.num_vehicles || 1) + 1)}
                variant="outline"
                size="sm"
                disabled={saving}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 Importante:</p>
              <p>
                Al cambiar el tamaño de la flota, se ajustará automáticamente la disponibilidad 
                de horarios. Más vehículos = más reservas simultáneas posibles.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Vehicles List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Vehículos</h3>
            <p className="text-sm text-gray-600">
              {vehicles.length} vehículo{vehicles.length !== 1 ? 's' : ''} configurado{vehicles.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={() => setShowAddVehicle(true)}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Vehículo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">{vehicle.name}</h4>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(vehicle.status)}`}>
                  {getStatusIcon(vehicle.status)}
                  {vehicle.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Capacidad:</span>
                  <span className="font-medium">{vehicle.capacity} mudanza{vehicle.capacity !== 1 ? 's' : ''}</span>
                </div>
                {vehicle.driver && (
                  <div className="flex justify-between">
                    <span>Conductor:</span>
                    <span className="font-medium">{vehicle.driver}</span>
                  </div>
                )}
                {vehicle.phone && (
                  <div className="flex justify-between">
                    <span>Teléfono:</span>
                    <span className="font-medium">{vehicle.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => updateVehicleStatus(vehicle.id, 'active')}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={vehicle.status === 'active'}
                >
                  Activo
                </Button>
                <Button
                  onClick={() => updateVehicleStatus(vehicle.id, 'maintenance')}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={vehicle.status === 'maintenance'}
                >
                  Mantenimiento
                </Button>
                <Button
                  onClick={() => removeVehicle(vehicle.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agregar Nuevo Vehículo
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Vehículo
                </label>
                <Input
                  type="text"
                  value={newVehicle.name}
                  onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                  placeholder="Ej: Camión 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad (mudanzas simultáneas)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={newVehicle.capacity}
                  onChange={(e) => setNewVehicle({ ...newVehicle, capacity: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conductor (opcional)
                </label>
                <Input
                  type="text"
                  value={newVehicle.driver}
                  onChange={(e) => setNewVehicle({ ...newVehicle, driver: e.target.value })}
                  placeholder="Nombre del conductor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono (opcional)
                </label>
                <Input
                  type="tel"
                  value={newVehicle.phone}
                  onChange={(e) => setNewVehicle({ ...newVehicle, phone: e.target.value })}
                  placeholder="+56912345678"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => setShowAddVehicle(false)}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button onClick={addVehicle}>
                Agregar Vehículo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

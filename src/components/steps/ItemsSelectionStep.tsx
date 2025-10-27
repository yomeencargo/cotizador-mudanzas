'use client'

import { useState, useEffect } from 'react'
import { useQuoteStore } from '@/store/quoteStore'
import { itemsCatalog, categories } from '@/data/itemsCatalog'
import { getPackagingOptions, PackagingOption } from '@/lib/packagingService'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { Search, Plus, Minus, Trash2, Package, AlertCircle, Box, Info, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateId } from '@/lib/utils'

interface ItemsSelectionStepProps {
  onNext: () => void
  onPrevious: () => void
}

export default function ItemsSelectionStep({ onNext, onPrevious }: ItemsSelectionStepProps) {
  const { items, addItem, updateItem, removeItem, calculateTotals, totalVolume } =
    useQuoteStore()

  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [showPackagingModal, setShowPackagingModal] = useState(false)
  const [showPackagingBanner, setShowPackagingBanner] = useState(true)
  const [selectedItemForPackaging, setSelectedItemForPackaging] = useState<string | null>(null)
  const [selectedPackaging, setSelectedPackaging] = useState<string>('none')
  const [packagingTypes, setPackagingTypes] = useState<PackagingOption[]>([])
  const [loadingPackaging, setLoadingPackaging] = useState(true)
  const [customItem, setCustomItem] = useState({
    name: '',
    volume: 0,
    weight: 0,
  })

  useEffect(() => {
    calculateTotals()
  }, [items, calculateTotals])

  // Cargar opciones de embalaje dinámicamente
  useEffect(() => {
    const loadPackagingOptions = async () => {
      try {
        setLoadingPackaging(true)
        const options = await getPackagingOptions()
        setPackagingTypes(options)
      } catch (error) {
        console.error('Error loading packaging options:', error)
        toast.error('Error al cargar opciones de embalaje')
      } finally {
        setLoadingPackaging(false)
      }
    }

    loadPackagingOptions()
  }, [])

  // Cargar preferencia del banner desde localStorage
  useEffect(() => {
    const hideBanner = localStorage.getItem('hidePackagingBanner')
    if (hideBanner === 'true') {
      setShowPackagingBanner(false)
    }
  }, [])

  const filteredItems = itemsCatalog.filter((item) => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getItemQuantity = (itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    return item?.quantity || 0
  }

  const handleAddItem = (catalogItem: typeof itemsCatalog[0]) => {
    const existingItem = items.find((i) => i.id === catalogItem.id)
    
    if (existingItem) {
      updateItem(existingItem.id, { quantity: existingItem.quantity + 1 })
    } else {
      addItem({
        ...catalogItem,
        quantity: 1,
      })
    }
  }

  const handleDecreaseItem = (itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    if (item) {
      if (item.quantity > 1) {
        updateItem(itemId, { quantity: item.quantity - 1 })
      } else {
        removeItem(itemId)
      }
    }
  }

  const handleAddCustomItem = () => {
    if (!customItem.name || customItem.volume <= 0 || customItem.weight <= 0) {
      toast.error('Completa todos los campos del item personalizado')
      return
    }

    addItem({
      id: `custom-${generateId()}`,
      name: customItem.name,
      category: 'Personalizado',
      volume: customItem.volume,
      weight: customItem.weight,
      quantity: 1,
      isFragile: false,
      isHeavy: customItem.weight > 50,
      isGlass: false,
    })

    setCustomItem({ name: '', volume: 0, weight: 0 })
    setShowCustomModal(false)
    toast.success('Item personalizado agregado')
  }

  const handleOpenPackagingModal = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      setSelectedItemForPackaging(itemId)
      setSelectedPackaging(item.packaging?.type || 'none')
      setShowPackagingModal(true)
    }
  }

  const handleSavePackaging = () => {
    if (!selectedItemForPackaging) return

    const packagingOption = packagingTypes.find(p => p.id === selectedPackaging)
    
    if (selectedPackaging === 'none') {
      // Remover embalaje
      updateItem(selectedItemForPackaging, { packaging: undefined })
      toast.success('Embalaje removido')
    } else if (packagingOption) {
      // Agregar/actualizar embalaje
      updateItem(selectedItemForPackaging, {
        packaging: {
          type: selectedPackaging,
          pricePerUnit: packagingOption.price
        }
      })
      toast.success(`Embalaje configurado: ${packagingOption.name}`)
    }

    setShowPackagingModal(false)
    setSelectedItemForPackaging(null)
  }

  // Calcular total de embalaje
  const packagingTotal = items.reduce((sum, item) => {
    if (item.packaging) {
      return sum + (item.packaging.pricePerUnit * item.quantity)
    }
    return sum
  }, 0)

  // Contar items con embalaje
  const itemsWithPackaging = items.filter(item => item.packaging && item.packaging.type !== 'none').length

  const handleNext = () => {
    if (items.length === 0) {
      toast.error('Debes seleccionar al menos un item')
      return
    }
    calculateTotals()
    onNext()
  }

  return (
    <div className="max-w-7xl mx-auto animate-slide-up">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Selecciona tus Items</h2>
        <p className="text-gray-600">
          Marca todos los muebles y objetos que necesitas transportar
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel izquierdo - Catálogo */}
        <div className="lg:col-span-2">
          <Card variant="elevated">
            {/* Buscador y filtros */}
            <div className="mb-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de items */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredItems.map((item) => {
                const quantity = getItemQuantity(item.id)
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                      quantity > 0
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="text-4xl text-center mb-2">{item.image}</div>
                    <h4 className="text-sm font-semibold text-center mb-1 min-h-[40px]">
                      {item.name}
                    </h4>
                    <div className="text-xs text-gray-500 text-center mb-3">
                      {item.volume}m³ • {item.weight}kg
                    </div>

                    {/* Indicadores */}
                    <div className="flex justify-center gap-1 mb-3">
                      {item.isFragile && <span className="text-xs">🔴</span>}
                      {item.isHeavy && <span className="text-xs">💪</span>}
                      {item.isGlass && <span className="text-xs">🪟</span>}
                    </div>

                    {/* Controles */}
                    {quantity === 0 ? (
                      <Button
                        size="sm"
                        onClick={() => handleAddItem(item)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDecreaseItem(item.id)}
                          className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                        <button
                          onClick={() => handleAddItem(item)}
                          className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Botón item personalizado */}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowCustomModal(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Item Personalizado
              </Button>
            </div>
          </Card>
        </div>

        {/* Panel derecho - Resumen */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {/* Banner informativo */}
            {showPackagingBanner && items.length > 0 && (
              <Card className="mb-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>💡 Nuevo:</strong> Ahora puedes configurar embalaje especial para cada item usando el botón 📦
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPackagingBanner(false)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Entendido
                      </button>
                      <button
                        onClick={() => {
                          setShowPackagingBanner(false)
                          localStorage.setItem('hidePackagingBanner', 'true')
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        No volver a mostrar
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Card variant="elevated" className="mb-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Resumen de Items
              </h3>

              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No has seleccionado items</p>
                </div>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto mb-4 space-y-2">
                    {items.map((item) => {
                      const hasPackaging = item.packaging && item.packaging.type !== 'none'
                      const packagingInfo = hasPackaging 
                        ? packagingTypes.find(p => p.id === item.packaging?.type)
                        : null

                      return (
                        <div
                          key={item.id}
                          className="p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.name}</div>
                              <div className="text-xs text-gray-500">x{item.quantity}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenPackagingModal(item.id)}
                                className={`p-1.5 rounded-lg transition-all relative group ${
                                  hasPackaging 
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                                title="Configurar embalaje"
                              >
                                <Box className="w-4 h-4" />
                                {hasPackaging && (
                                  <CheckCircle2 className="w-3 h-3 absolute -top-1 -right-1 text-green-600 bg-white rounded-full" />
                                )}
                              </button>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {hasPackaging && packagingInfo && (
                            <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                              {packagingInfo.icon} {packagingInfo.name} - ${packagingInfo.price.toLocaleString()} por m³
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Items:</span>
                      <span className="font-bold">
                        {items.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Volumen Total:</span>
                      <span className="font-bold">{totalVolume.toFixed(2)} m³</span>
                    </div>
                    {itemsWithPackaging > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-green-700">
                          <span>📦 Items con embalaje:</span>
                          <span className="font-bold">{itemsWithPackaging}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-700">
                          <span>Total embalaje:</span>
                          <span className="font-bold">${packagingTotal.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </Card>

            {/* Leyenda */}
            <Card className="bg-blue-50 border-blue-200">
              <h4 className="font-semibold mb-2 text-sm">Leyenda:</h4>
              <div className="space-y-1 text-xs">
                <div>🔴 Frágil</div>
                <div>💪 Pesado</div>
                <div>🪟 Vidrio</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Item Personalizado */}
      <Modal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Agregar Item Personalizado"
      >
        <div className="space-y-4">
          <Input
            label="Nombre del Item"
            placeholder="Ej: Piano de cola"
            value={customItem.name}
            onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
          />
          <Input
            label="Volumen estimado (m³)"
            type="number"
            step="0.1"
            placeholder="1.5"
            value={customItem.volume || ''}
            onChange={(e) =>
              setCustomItem({ ...customItem, volume: parseFloat(e.target.value) || 0 })
            }
          />
          <Input
            label="Peso estimado (kg)"
            type="number"
            placeholder="50"
            value={customItem.weight || ''}
            onChange={(e) =>
              setCustomItem({ ...customItem, weight: parseFloat(e.target.value) || 0 })
            }
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCustomModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleAddCustomItem} className="flex-1">
              Agregar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Configurar Embalaje */}
      <Modal
        isOpen={showPackagingModal}
        onClose={() => {
          setShowPackagingModal(false)
          setSelectedItemForPackaging(null)
        }}
        title="Configurar Embalaje"
      >
        <div className="space-y-4">
          {selectedItemForPackaging && (
            <>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Item seleccionado:</div>
                <div className="font-semibold">
                  {items.find(i => i.id === selectedItemForPackaging)?.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Cantidad: {items.find(i => i.id === selectedItemForPackaging)?.quantity} unidad(es)
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecciona el tipo de embalaje:
                </label>
                <div className="space-y-2">
                  {packagingTypes.map((type) => {
                    const item = items.find(i => i.id === selectedItemForPackaging)
                    const totalPrice = type.price * (item?.quantity || 1)
                    
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedPackaging(type.id)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          selectedPackaging === type.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{type.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold">{type.name}</span>
                              {type.price > 0 && (
                                <span className="text-primary-600 font-bold">
                                  ${type.price.toLocaleString()} c/u
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{type.description}</p>
                            {type.price > 0 && item && item.quantity > 1 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Total: ${totalPrice.toLocaleString()} ({item.quantity} unidades)
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>💡 Tip:</strong> El embalaje se cobra por unidad. Si tienes múltiples 
                  unidades del mismo item, el costo se multiplica automáticamente.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPackagingModal(false)
                    setSelectedItemForPackaging(null)
                  }} 
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={handleSavePackaging} className="flex-1">
                  Guardar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Botones */}
      <div className="flex gap-4 mt-6">
        <Button type="button" onClick={onPrevious} variant="outline" className="flex-1">
          ← Volver
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Continuar →
        </Button>
      </div>
    </div>
  )
}


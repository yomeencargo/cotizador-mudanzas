import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getPricingConfig } from '@/lib/pricingService'
import { calculateDistanceByAddresses } from '@/lib/mapsService'
import { crewCost, requiredPeople, stairTrips, stairsCost } from '@/lib/crewPricing'
import { hasFridge, overCapacitySurcharge } from '@/lib/extraServices'

export interface PersonalInfo {
  name: string
  email: string
  phone: string
  isCompany: boolean
  companyName?: string
  companyRut?: string
}

export interface Address {
  street: string
  number: string
  commune: string
  region: string
  additionalInfo?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface PropertyDetails {
  propertyType: 'casa' | 'departamento' | 'oficina' | 'bodega' | 'otro'
  floor: number
  hasElevator: boolean
  parkingDistance: number
}

export interface PackagingOption {
  id: string
  name: string
  price: number
  description: string
}

export interface Item {
  id: string
  name: string
  category: string
  volume: number
  weight: number
  quantity: number
  isFragile: boolean
  isHeavy: boolean
  isGlass: boolean
  image?: string
  packaging?: {
    type: string
    pricePerUnit: number
  }
}

export interface AdditionalServices {
  disassembly: boolean
  assembly: boolean
  packing: boolean
  unpacking: boolean
  observations: string
  photos: string[]
  /**
   * Ayudantes que el cliente agrega POR SOBRE los que el peso ya obliga a mandar.
   * Más gente = más rápido y con más cuidado; no reemplaza a la cuadrilla mínima.
   */
  extraHelpers: number
  /**
   * Desarmado de refrigerador. Solo se ofrece si hay un refrigerador entre los items
   * (ver `hasFridge`); si el cliente lo saca de la lista después de haberlo marcado,
   * el cargo se cae solo en el cálculo.
   */
  fridgeDisassembly: boolean
  /** Priority: agenda libre con horario flexible, por encima de la disponibilidad normal. */
  priority: boolean
}

export interface QuoteState {
  personalInfo: PersonalInfo | null
  dateTime: Date | null
  isFlexible: boolean
  origin: {
    address: Address | null
    details: PropertyDetails | null
  }
  destination: {
    address: Address | null
    details: PropertyDetails | null
  }
  items: Item[]
  additionalServices: AdditionalServices
  totalVolume: number
  totalWeight: number
  totalDistance: number // km calculados (real o estimado)
  estimatedPrice: number
  recommendedVehicle: string
  /** Personas que el peso obliga a mandar (sin contar los ayudantes agregados). */
  requiredCrew: number
  /** Cuadrilla total cotizada: obligatorias + ayudantes extra. */
  totalCrew: number
  /** Viajes por escalera que implica la cantidad de bultos. */
  stairTrips: number
  isConfirmed: boolean

  // Actions
  setPersonalInfo: (info: PersonalInfo) => void
  setDateTime: (date: Date, isFlexible: boolean) => void
  setOriginAddress: (address: Address) => void
  setDestinationAddress: (address: Address) => void
  setOriginDetails: (details: PropertyDetails) => void
  setDestinationDetails: (details: PropertyDetails) => void
  addItem: (item: Item) => void
  updateItem: (id: string, item: Partial<Item>) => void
  removeItem: (id: string) => void
  setAdditionalServices: (services: AdditionalServices) => void
  calculateTotals: () => void
  setConfirmed: (confirmed: boolean) => void
  resetQuote: () => void
}

const initialState = {
  personalInfo: null,
  dateTime: null,
  isFlexible: false,
  origin: {
    address: null,
    details: null,
  },
  destination: {
    address: null,
    details: null,
  },
  items: [],
  additionalServices: {
    disassembly: false,
    assembly: false,
    packing: false,
    unpacking: false,
    observations: '',
    photos: [],
    extraHelpers: 0,
    fridgeDisassembly: false,
    priority: false,
  },
  totalVolume: 0,
  totalWeight: 0,
  totalDistance: 0,
  estimatedPrice: 0,
  recommendedVehicle: 'Camioneta',
  requiredCrew: 1,
  totalCrew: 1,
  stairTrips: 1,
  isConfirmed: false,
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPersonalInfo: (info) => set({ personalInfo: info }),

      setDateTime: (date, isFlexible) => set({ dateTime: date, isFlexible }),

      setOriginAddress: (address) =>
        set((state) => ({
          origin: { ...state.origin, address },
        })),

      setDestinationAddress: (address) =>
        set((state) => ({
          destination: { ...state.destination, address },
        })),

      setOriginDetails: (details) =>
        set((state) => ({
          origin: { ...state.origin, details },
        })),

      setDestinationDetails: (details) =>
        set((state) => ({
          destination: { ...state.destination, details },
        })),

      addItem: (item) =>
        set((state) => {
          const newItems = [...state.items, item]
          return { items: newItems }
        }),

      updateItem: (id, updatedItem) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updatedItem } : item
          ),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      setAdditionalServices: (services) => set({ additionalServices: services }),

      setConfirmed: (confirmed) => set({ isConfirmed: confirmed }),

      calculateTotals: async () => {
        const state = get()

        // Obtener configuración de precios dinámicamente
        const pricing = await getPricingConfig()

        const totalVolume = state.items.reduce(
          (sum, item) => sum + item.volume * item.quantity,
          0
        )
        const totalWeight = state.items.reduce(
          (sum, item) => sum + item.weight * item.quantity,
          0
        )

        // Determinar vehículo recomendado
        let recommendedVehicle = 'Camioneta'
        if (totalVolume > 20) recommendedVehicle = 'Furgón Grande'
        else if (totalVolume > 10) recommendedVehicle = 'Furgón Mediano'
        else if (totalVolume > 5) recommendedVehicle = 'Camioneta Grande'

        // Calcular distancia real
        let distance = 10 // km por defecto

        if (state.origin.address && state.destination.address) {
          try {
            distance = await calculateDistanceByAddresses(
              state.origin.address.street,
              state.origin.address.number,
              state.origin.address.commune,
              state.origin.address.region,
              state.destination.address.street,
              state.destination.address.number,
              state.destination.address.commune,
              state.destination.address.region
            )
          } catch (error) {
            console.error('Error calculating distance:', error)
            // Usar distancia por defecto si falla
          }
        }

        // Cálculo de precio base usando configuración dinámica
        let basePrice = pricing.basePrice

        // Precio por volumen
        basePrice += totalVolume * pricing.pricePerCubicMeter

        // Ajuste por distancia (solo cobrar km adicionales después de los km gratis)
        const freeKilometers = pricing.freeKilometers || 50
        const chargeableKm = Math.max(0, distance - freeKilometers)
        basePrice += chargeableKm * pricing.pricePerKilometer

        // Ajuste por piso sin ascensor. Se multiplica por los viajes que implica la
        // carga: antes era plano y subir un velador a un 3º costaba igual que subir
        // treinta bultos.
        const trips = stairTrips(state.items, pricing.stairs)
        basePrice += stairsCost(
          state.origin.details?.floor,
          state.origin.details?.hasElevator,
          state.items,
          pricing.floorSurcharge,
          pricing.stairs
        )
        basePrice += stairsCost(
          state.destination.details?.floor,
          state.destination.details?.hasElevator,
          state.items,
          pricing.floorSurcharge,
          pricing.stairs
        )

        // Cuadrilla: el bulto más pesado define cuánta gente hace falta, y el cliente
        // puede sumar ayudantes por encima de ese mínimo.
        const crewByWeight = requiredPeople(state.items, pricing.crew)
        const totalCrew = Math.min(
          pricing.crew.maxPeople,
          crewByWeight + Math.max(0, state.additionalServices.extraHelpers || 0)
        )
        basePrice += crewCost(totalCrew, pricing.crew)

        // Cargo por fin de semana: sábado (6) y domingo (0) con el mismo porcentaje
        if (state.dateTime) {
          const dayOfWeek = new Date(state.dateTime).getDay()
          if (dayOfWeek === 6 || dayOfWeek === 0) {
            basePrice += (basePrice * pricing.timeSurcharges.saturday) / 100
          }
        }

        // Servicios adicionales
        if (state.additionalServices.disassembly) basePrice += pricing.additionalServices.disassembly
        if (state.additionalServices.assembly) basePrice += pricing.additionalServices.assembly
        // packing y unpacking requieren contacto con ejecutivo, no se suman al precio

        // Desarmado de refrigerador: va acá, junto al desarme y el armado, porque es el
        // mismo tipo de cobro (mano de obra) y sigue su misma suerte —recargo de fin de
        // semana y descuento por flexibilidad—. Se exige que el refrigerador SIGA en la
        // lista: si el cliente lo marcó y después borró el item, el cargo desaparece.
        if (state.additionalServices.fridgeDisassembly && hasFridge(state.items)) {
          basePrice += pricing.additionalServices.fridgeDisassembly
        }

        // Costo de embalaje especial - CORREGIDO: se calcula por volumen de items con embalaje
        // Agrupar items por tipo de embalaje y calcular el volumen específico de cada tipo
        const packagingCost = state.items
          .filter(item => item.packaging && item.packaging.type !== 'none')
          .reduce((acc, item) => {
            const itemVolume = item.volume * item.quantity
            const itemPackagingCost = item.packaging?.pricePerUnit || 0
            return acc + (itemPackagingCost * itemVolume)
          }, 0)

        basePrice += packagingCost

        // Items frágiles o de vidrio
        const fragileCount = state.items.filter((item) => item.isFragile || item.isGlass).length
        basePrice += fragileCount * pricing.specialPackaging.fragile

        // Descuento por flexibilidad
        if (state.isFlexible) {
          basePrice -= (basePrice * pricing.discounts.flexibility) / 100
        }

        // Recargo por exceso de volumen y Priority: PLANOS y al final, después del
        // descuento por flexibilidad y del recargo de fin de semana, antes del IVA.
        //
        // Van acá y no arriba porque Tomás los definió como montos fijos ($29.990 y
        // $99.990): sumarlos antes haría que el recargo de sábado y el descuento por
        // flexibilidad los movieran, y dejarían de ser el número que él dijo. El IVA sí
        // los alcanza, porque es un impuesto sobre el total.
        basePrice += overCapacitySurcharge(totalVolume, pricing.additionalServices)
        if (state.additionalServices.priority) basePrice += pricing.additionalServices.priority

        // Agregar IVA si es empresa (factura)
        if (state.personalInfo?.isCompany) {
          basePrice = basePrice * 1.19
        }

        set({
          totalVolume,
          totalWeight,
          totalDistance: distance,
          estimatedPrice: Math.round(basePrice),
          recommendedVehicle,
          requiredCrew: crewByWeight,
          totalCrew,
          stairTrips: trips,
        })
      },

      resetQuote: () => set(initialState),
    }),
    {
      name: 'quote-storage',
    }
  )
)


/**
 * SERVICIO DE CONFIGURACIÓN DE PRECIOS
 * 
 * Este servicio obtiene la configuración de precios desde la base de datos
 * y la convierte al formato esperado por el sistema de cotización.
 */

import { DEFAULT_CREW, DEFAULT_STAIRS, type CrewConfig, type StairsConfig } from '@/lib/crewPricing'
import { DEFAULT_EXTRA_SERVICES, type ExtraServicesConfig } from '@/lib/extraServices'

export interface PricingConfig {
  basePrice: number
  pricePerCubicMeter: number
  pricePerKilometer: number
  freeKilometers: number
  floorSurcharge: number
  /** Personas incluidas, escalón de peso y precio por persona extra. */
  crew: CrewConfig
  /** Cada cuántos bultos se repite el cargo por piso. */
  stairs: StairsConfig
  /**
   * Los 4 campos de `ExtraServicesConfig` (desarmado de refrigerador, Priority y el
   * recargo por exceso de volumen) viven acá dentro a propósito: `additional_services`
   * ya es una columna JSONB, así que agregarlos NO necesita migración. Una fila vieja
   * que no los tenga se completa con los valores por defecto al leerla.
   */
  additionalServices: {
    packing: number
    unpacking: number
    disassembly: number
    assembly: number
  } & ExtraServicesConfig
  specialPackaging: {
    fragile: number
    electronics: number
    artwork: number
  }
  timeSurcharges: {
    saturday: number
    sunday: number
    holiday: number
  }
  discounts: {
    flexibility: number
    advanceBooking: number
    repeatCustomer: number
  }
}

// Cache para evitar múltiples llamadas
let pricingCache: PricingConfig | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export async function getPricingConfig(): Promise<PricingConfig> {
  // Verificar cache
  const now = Date.now()
  if (pricingCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return pricingCache
  }

  try {
    const response = await fetch('/api/admin/pricing-config')
    if (!response.ok) {
      throw new Error('Error obteniendo configuración de precios')
    }
    
    const config = await response.json()
    
    // Actualizar cache
    pricingCache = config
    cacheTimestamp = now
    
    return config
  } catch (error) {
    console.error('Error fetching pricing config:', error)
    
    // Devolver configuración por defecto si falla
    return {
      basePrice: 50000,
      pricePerCubicMeter: 15000,
      pricePerKilometer: 800,
      freeKilometers: 50,
      floorSurcharge: 5000,
    additionalServices: {
      packing: 25000,
      unpacking: 20000,
      disassembly: 15000,
      assembly: 15000,
      ...DEFAULT_EXTRA_SERVICES
    },
      specialPackaging: {
        fragile: 10000,
        electronics: 15000,
        artwork: 25000
      },
      timeSurcharges: {
        saturday: 20,
        sunday: 50,
        holiday: 100
      },
      discounts: {
        flexibility: 10,
        advanceBooking: 5,
        repeatCustomer: 15
      },
      crew: { ...DEFAULT_CREW },
      stairs: { ...DEFAULT_STAIRS }
    }
  }
}

// Función para limpiar cache (útil cuando se actualiza la configuración)
export function clearPricingCache() {
  pricingCache = null
  cacheTimestamp = 0
}

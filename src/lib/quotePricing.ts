/**
 * CÁLCULO DEL PRECIO DE UNA COTIZACIÓN — la única fuente de verdad.
 *
 * Vivía dentro de `calculateTotals()` en `src/store/quoteStore.ts`, o sea del lado del
 * navegador: la API recibía el total ya calculado y solo lo guardaba. Cualquier otro
 * canal que tuviera que cotizar —el chatbot, que no tiene browser— habría tenido que
 * replicar la fórmula, y dos copias se separan el día que Tomás edita `pricing_config`.
 *
 * Acá adentro no hay red ni estado: entra todo resuelto (items, configuración de precios
 * y la distancia ya medida) y sale el número. Quién lee la configuración y quién mide la
 * distancia es problema del que llama —el store en la web, el endpoint en el servidor—,
 * y por eso el mismo cálculo sirve en los dos lados.
 *
 * EL ORDEN DE LAS SUMAS ES PARTE DE LA DEFINICIÓN DEL PRECIO, no un detalle: el recargo
 * de fin de semana, el descuento por flexibilidad y el IVA son porcentajes, así que mover
 * un cargo de lugar cambia la plata. Cada tramo dice por qué está donde está.
 */

import { crewCost, requiredPeople, stairTrips, stairsCost } from '@/lib/crewPricing'
import { hasFridge, overCapacitySurcharge } from '@/lib/extraServices'
import type { PricingConfig } from '@/lib/pricingService'

/** Un item de la mudanza, con lo único que el precio necesita saber de él. */
export interface QuoteItemInput {
  id?: string
  name?: string
  volume: number
  weight: number
  quantity: number
  isFragile?: boolean
  isGlass?: boolean
  packaging?: {
    type: string
    pricePerUnit: number
  }
}

/** Piso y ascensor de una punta del traslado. */
export interface QuotePropertyInput {
  floor?: number
  hasElevator?: boolean
}

/** Los servicios que el cliente marcó. Solo los que mueven el precio. */
export interface QuoteServicesInput {
  disassembly?: boolean
  assembly?: boolean
  fridgeDisassembly?: boolean
  priority?: boolean
  extraHelpers?: number
}

export interface QuotePricingInput {
  items: QuoteItemInput[]
  origin?: QuotePropertyInput | null
  destination?: QuotePropertyInput | null
  /** Distancia de la ruta completa, con las paradas ya sumadas. La mide el que llama. */
  distanceKm: number
  /** Fecha de la mudanza: define el recargo de fin de semana. */
  dateTime?: string | Date | null
  isFlexible?: boolean
  /** Empresa = se factura, o sea IVA sobre el total. */
  isCompany?: boolean
  additionalServices?: QuoteServicesInput | null
  pricing: PricingConfig
}

export interface QuotePricingResult {
  totalVolume: number
  totalWeight: number
  estimatedPrice: number
  recommendedVehicle: string
  /** Personas que obliga el peso del bulto más pesado. */
  requiredCrew: number
  /** Las anteriores más los ayudantes que sumó el cliente, topeado en `crew.maxPeople`. */
  totalCrew: number
  stairTrips: number
}

/** Vehículo que se recomienda para ese volumen. Informativo: no entra en el precio. */
export function recommendVehicle(totalVolumeM3: number): string {
  if (totalVolumeM3 > 20) return 'Furgón Grande'
  if (totalVolumeM3 > 10) return 'Furgón Mediano'
  if (totalVolumeM3 > 5) return 'Camioneta Grande'
  return 'Camioneta'
}

export function totalVolumeOf(items: QuoteItemInput[]): number {
  return (items || []).reduce((sum, item) => sum + (item.volume || 0) * (item.quantity || 0), 0)
}

export function totalWeightOf(items: QuoteItemInput[]): number {
  return (items || []).reduce((sum, item) => sum + (item.weight || 0) * (item.quantity || 0), 0)
}

export function calculateQuote(input: QuotePricingInput): QuotePricingResult {
  const items = input.items || []
  const pricing = input.pricing
  const services = input.additionalServices || {}

  const totalVolume = totalVolumeOf(items)
  const totalWeight = totalWeightOf(items)
  const recommendedVehicle = recommendVehicle(totalVolume)
  const distance = Number.isFinite(input.distanceKm) ? input.distanceKm : 0

  let basePrice = pricing.basePrice

  // Precio por volumen
  basePrice += totalVolume * pricing.pricePerCubicMeter

  // Ajuste por distancia (solo se cobran los km posteriores a los gratis)
  const freeKilometers = pricing.freeKilometers || 50
  const chargeableKm = Math.max(0, distance - freeKilometers)
  basePrice += chargeableKm * pricing.pricePerKilometer

  // Ajuste por piso sin ascensor. Se multiplica por los viajes que implica la carga:
  // antes era plano y subir un velador a un 3º costaba igual que subir treinta bultos.
  const trips = stairTrips(items, pricing.stairs)
  basePrice += stairsCost(
    input.origin?.floor,
    input.origin?.hasElevator,
    items,
    pricing.floorSurcharge,
    pricing.stairs
  )
  basePrice += stairsCost(
    input.destination?.floor,
    input.destination?.hasElevator,
    items,
    pricing.floorSurcharge,
    pricing.stairs
  )

  // Cuadrilla: el bulto más pesado define cuánta gente hace falta, y el cliente puede
  // sumar ayudantes por encima de ese mínimo.
  const crewByWeight = requiredPeople(items, pricing.crew)
  const totalCrew = Math.min(
    pricing.crew.maxPeople,
    crewByWeight + Math.max(0, services.extraHelpers || 0)
  )
  basePrice += crewCost(totalCrew, pricing.crew)

  // Cargo por fin de semana: sábado (6) y domingo (0) con el mismo porcentaje
  if (input.dateTime) {
    const dayOfWeek = new Date(input.dateTime).getDay()
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      basePrice += (basePrice * pricing.timeSurcharges.saturday) / 100
    }
  }

  // Servicios adicionales
  if (services.disassembly) basePrice += pricing.additionalServices.disassembly
  if (services.assembly) basePrice += pricing.additionalServices.assembly
  // packing y unpacking requieren contacto con ejecutivo, no se suman al precio

  // Desarmado de refrigerador: va acá, junto al desarme y el armado, porque es el mismo
  // tipo de cobro (mano de obra) y sigue su misma suerte —recargo de fin de semana y
  // descuento por flexibilidad—. Se exige que el refrigerador SIGA en la lista: si el
  // cliente lo marcó y después borró el item, el cargo desaparece.
  if (services.fridgeDisassembly && hasFridge(items)) {
    basePrice += pricing.additionalServices.fridgeDisassembly
  }

  // Embalaje especial: por volumen de los items que lo llevan, no por item.
  const packagingCost = items
    .filter((item) => item.packaging && item.packaging.type !== 'none')
    .reduce((acc, item) => {
      const itemVolume = (item.volume || 0) * (item.quantity || 0)
      const itemPackagingCost = item.packaging?.pricePerUnit || 0
      return acc + itemPackagingCost * itemVolume
    }, 0)

  basePrice += packagingCost

  // Items frágiles o de vidrio
  const fragileCount = items.filter((item) => item.isFragile || item.isGlass).length
  basePrice += fragileCount * pricing.specialPackaging.fragile

  // Descuento por flexibilidad
  if (input.isFlexible) {
    basePrice -= (basePrice * pricing.discounts.flexibility) / 100
  }

  // Recargo por exceso de volumen y Priority: PLANOS y al final, después del descuento
  // por flexibilidad y del recargo de fin de semana, antes del IVA.
  //
  // Van acá y no arriba porque Tomás los definió como montos fijos ($29.990 y $99.990):
  // sumarlos antes haría que el recargo de sábado y el descuento por flexibilidad los
  // movieran, y dejarían de ser el número que él dijo. El IVA sí los alcanza, porque es
  // un impuesto sobre el total.
  basePrice += overCapacitySurcharge(totalVolume, pricing.additionalServices)
  if (services.priority) basePrice += pricing.additionalServices.priority

  // Agregar IVA si es empresa (factura)
  if (input.isCompany) {
    basePrice = basePrice * 1.19
  }

  return {
    totalVolume,
    totalWeight,
    estimatedPrice: Math.round(basePrice),
    recommendedVehicle,
    requiredCrew: crewByWeight,
    totalCrew,
    stairTrips: trips,
  }
}

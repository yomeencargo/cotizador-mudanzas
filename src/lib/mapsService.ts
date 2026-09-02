import { MAPS_CONFIG } from '@/config/maps'

/**
 * Tipos de respuesta de Geoapify APIs
 */
interface GeocodeResult {
  lat: number
  lng: number
}

interface DistanceResult {
  kilometers: number
  duration: number // minutos
}

/**
 * Caché en memoria para resultados de geocoding
 * Formato: "street,number,commune,region" -> GeocodeResult
 */
const geocodeCache = new Map<string, GeocodeResult>()

/**
 * Caché en memoria para resultados de distancia
 * Formato: "lat1,lng1,lat2,lng2" -> DistanceResult
 */
const distanceCache = new Map<string, DistanceResult>()

/**
 * Map de peticiones en progreso para deduplicación
 * Evita hacer múltiples llamadas simultáneas para lo mismo
 */
const pendingGeocodeRequests = new Map<string, Promise<GeocodeResult | null>>()
const pendingDistanceRequests = new Map<string, Promise<DistanceResult | null>>()

/**
 * Genera una clave de caché para geocoding
 */
function getGeocodeKey(street: string, number: string, commune: string, region: string): string {
  return `${street.toLowerCase()},${number.toLowerCase()},${commune.toLowerCase()},${region.toLowerCase()}`
}

/**
 * Genera una clave de caché para distancia
 */
function getDistanceKey(originLat: number, originLng: number, destLat: number, destLng: number): string {
  return `${originLat},${originLng},${destLat},${destLng}`
}

/**
 * Convierte una dirección en coordenadas (lat, lng)
 * Usa caché y deduplicación para optimizar llamadas
 * 
 * @param street - Calle
 * @param number - Número
 * @param commune - Comuna
 * @param region - Región
 * @returns Coordenadas o null si falla
 */
export async function geocodeAddress(
  street: string,
  number: string,
  commune: string,
  region: string
): Promise<GeocodeResult | null> {
  // Si no hay API key, retornar null
  if (!MAPS_CONFIG.apiKey) {
    console.warn('Geoapify API key not configured')
    return null
  }

  const key = getGeocodeKey(street, number, commune, region)

  // 1. Verificar si ya está en caché
  if (geocodeCache.has(key)) {
    console.log('📦 Geocode caché hit:', key)
    return geocodeCache.get(key)!
  }

  // 2. Verificar si ya hay una petición en progreso (deduplicación)
  if (pendingGeocodeRequests.has(key)) {
    console.log('⏳ Geocode request en progreso:', key)
    return pendingGeocodeRequests.get(key)!
  }

  // 3. Crear nueva petición
  const promise = (async () => {
    try {
      // Llamar a nuestra API route en lugar de Geoapify directamente
      const response = await fetch('/api/maps/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          street,
          number,
          commune,
          region,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.warn('Geocoding failed:', errorData.status || response.status)
        return null
      }

      const data = await response.json()
      const result = {
        lat: data.lat,
        lng: data.lng,
      }

      // Guardar en caché
      geocodeCache.set(key, result)
      console.log('💾 Geocode guardado en caché:', key)

      return result
    } catch (error) {
      console.error('Error geocoding address:', error)
      return null
    } finally {
      // Limpiar de peticiones pendientes
      pendingGeocodeRequests.delete(key)
    }
  })()

  // Guardar petición en progreso
  pendingGeocodeRequests.set(key, promise)
  return promise
}

/**
 * Calcula la distancia entre dos puntos usando coordenadas
 * Usa caché y deduplicación para optimizar llamadas
 * 
 * @param originLat - Latitud origen
 * @param originLng - Longitud origen
 * @param destLat - Latitud destino
 * @param destLng - Longitud destino
 * @returns Distancia en km y duración en minutos, o null si falla
 */
export async function calculateDistanceByCoordinates(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DistanceResult | null> {
  // Si no hay API key, retornar null
  if (!MAPS_CONFIG.apiKey) {
    console.warn('Geoapify API key not configured')
    return null
  }

  const key = getDistanceKey(originLat, originLng, destLat, destLng)

  // 1. Verificar si ya está en caché
  if (distanceCache.has(key)) {
    console.log('📦 Distance caché hit:', key)
    return distanceCache.get(key)!
  }

  // 2. Verificar si ya hay una petición en progreso (deduplicación)
  if (pendingDistanceRequests.has(key)) {
    console.log('⏳ Distance request en progreso:', key)
    return pendingDistanceRequests.get(key)!
  }

  // 3. Crear nueva petición
  const promise = (async () => {
    try {
      // Llamar a nuestra API route en lugar de Geoapify directamente
      const response = await fetch('/api/maps/distance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originLat,
          originLng,
          destLat,
          destLng,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.warn('Distance calculation failed:', errorData.status || response.status)
        return null
      }

      const data = await response.json()
      const result = {
        kilometers: data.kilometers,
        duration: data.duration,
      }

      // Guardar en caché
      distanceCache.set(key, result)
      console.log('💾 Distance guardado en caché:', key)

      return result
    } catch (error) {
      console.error('Error calculating distance:', error)
      return null
    } finally {
      // Limpiar de peticiones pendientes
      pendingDistanceRequests.delete(key)
    }
  })()

  // Guardar petición en progreso
  pendingDistanceRequests.set(key, promise)
  return promise
}

/**
 * Calcula la distancia usando direcciones completas
 * Primero hace geocoding de ambas direcciones, luego calcula distancia
 * 
 * @param originStreet - Calle origen
 * @param originNumber - Número origen
 * @param originCommune - Comuna origen
 * @param originRegion - Región origen
 * @param destStreet - Calle destino
 * @param destNumber - Número destino
 * @param destCommune - Comuna destino
 * @param destRegion - Región destino
 * @returns Distancia en km, o distancia por defecto si falla
 */
export async function calculateDistanceByAddresses(
  originStreet: string,
  originNumber: string,
  originCommune: string,
  originRegion: string,
  destStreet: string,
  destNumber: string,
  destCommune: string,
  destRegion: string
): Promise<number> {
  try {
    // Geocodificar origen
    const originCoords = await geocodeAddress(
      originStreet,
      originNumber,
      originCommune,
      originRegion
    )

    // Geocodificar destino
    const destCoords = await geocodeAddress(
      destStreet,
      destNumber,
      destCommune,
      destRegion
    )

    // Si ambos tienen coordenadas, calcular distancia
    if (originCoords && destCoords) {
      const result = await calculateDistanceByCoordinates(
        originCoords.lat,
        originCoords.lng,
        destCoords.lat,
        destCoords.lng
      )

      if (result) {
        return result.kilometers
      }
    }

    // Si falla, usar distancia por defecto
    console.warn('Using default distance')
    return MAPS_CONFIG.defaultDistance
  } catch (error) {
    console.error('Error in calculateDistanceByAddresses:', error)
    return MAPS_CONFIG.defaultDistance
  }
}

/** Un punto de la ruta. Misma forma que las direcciones del cotizador. */
export interface RoutePoint {
  street: string
  number: string
  commune: string
  region: string
}

/**
 * Distancia total de una ruta con paradas: origen → parada 1 → … → destino.
 *
 * Suma los tramos en vez de medir origen→destino en línea, que es lo que hacía antes.
 * Con paradas eso subestimaba el viaje real, y como los km se cobran, subestimaba el
 * precio.
 *
 * SI ALGÚN TRAMO NO SE PUEDE MEDIR se cae al viaje directo origen→destino (el
 * comportamiento anterior) y, si eso tampoco se puede, a la distancia por defecto.
 * Se prefiere quedarse corto antes que inflar: un fallo de geocodificación no puede
 * terminar en un cobro de más al cliente.
 */
export async function calculateRouteDistance(points: RoutePoint[]): Promise<number> {
  const validos = (points || []).filter(
    (p) => p && p.street && p.commune
  )
  if (validos.length < 2) return MAPS_CONFIG.defaultDistance

  const directo = () =>
    calculateDistanceByAddresses(
      validos[0].street,
      validos[0].number,
      validos[0].commune,
      validos[0].region,
      validos[validos.length - 1].street,
      validos[validos.length - 1].number,
      validos[validos.length - 1].commune,
      validos[validos.length - 1].region
    )

  // Sin paradas es exactamente el cálculo de siempre.
  if (validos.length === 2) return directo()

  try {
    const coords = await Promise.all(
      validos.map((p) => geocodeAddress(p.street, p.number, p.commune, p.region))
    )
    if (coords.some((c) => !c)) {
      console.warn('[maps] Alguna parada no se pudo geocodificar; se usa el viaje directo')
      return directo()
    }

    let total = 0
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i]!
      const b = coords[i + 1]!
      const tramo = await calculateDistanceByCoordinates(a.lat, a.lng, b.lat, b.lng)
      if (!tramo) {
        console.warn(`[maps] No se pudo medir el tramo ${i + 1}; se usa el viaje directo`)
        return directo()
      }
      total += tramo.kilometers
    }
    return total
  } catch (error) {
    console.error('[maps] Error calculando la ruta con paradas:', error)
    return directo()
  }
}

/**
 * Fórmula de Haversine (fallback si no hay API)
 * Calcula distancia entre dos coordenadas
 * 
 * @param lat1 - Latitud punto 1
 * @param lon1 - Longitud punto 1
 * @param lat2 - Latitud punto 2
 * @param lon2 - Longitud punto 2
 * @returns Distancia en kilómetros
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 100) / 100
}

/**
 * Obtiene estadísticas de la caché
 * Útil para debugging y monitoreo
 */
export function getCacheStats() {
  return {
    geocodeCache: {
      size: geocodeCache.size,
      keys: Array.from(geocodeCache.keys()),
    },
    distanceCache: {
      size: distanceCache.size,
      keys: Array.from(distanceCache.keys()),
    },
    pendingRequests: {
      geocode: pendingGeocodeRequests.size,
      distance: pendingDistanceRequests.size,
    },
  }
}

/**
 * Limpia toda la caché
 * Útil al cambiar de usuario o sesión
 */
export function clearCache() {
  geocodeCache.clear()
  distanceCache.clear()
  console.log('✨ Cache limpiado')
}

/**
 * Limpia la caché de geocoding
 */
export function clearGeocodeCache() {
  geocodeCache.clear()
  console.log('✨ Geocode cache limpiado')
}

/**
 * Limpia la caché de distancias
 */
export function clearDistanceCache() {
  distanceCache.clear()
  console.log('✨ Distance cache limpiado')
}


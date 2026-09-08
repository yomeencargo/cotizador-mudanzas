/**
 * CONFIGURACIÓN DE GEOAPIFY API
 * 
 * Para obtener tu API Key:
 * 1. Ve a: https://www.geoapify.com/
 * 2. Crea una cuenta gratuita
 * 3. Crea un nuevo proyecto
 * 4. Copia la API key y pégala en .env.local:
 *    NEXT_PUBLIC_GEOAPIFY_API_KEY=tu_key_aquí
 * 
 * VENTAJAS DE GEOAPIFY:
 * - 90,000 requests/mes GRATIS (vs 10,000 de Google)
 * - Sin restricciones de almacenamiento de datos
 * - Precios más estables y predecibles
 * - APIs no marcadas como "legacy"
 * - Mejor soporte técnico
 * 
 * IMPORTANTE:
 * - En producción, restringe la key a tu dominio
 * - Plan gratuito: 90,000 requests/mes
 * - Plan Starter: $9/mes para 300,000 requests/mes
 */

export const MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '',
  
  // URLs de Geoapify API
  geocodingUrl: 'https://api.geoapify.com/v1/geocode/search',
  autocompleteUrl: 'https://api.geoapify.com/v1/geocode/autocomplete',
  distanceMatrixUrl: 'https://api.geoapify.com/v1/routing',
  
  // Configuración de fallback
  defaultDistance: 10, // km por defecto si falla la API
  
  // Opciones de la API
  language: 'es',
  country: 'cl', // Chile
  format: 'json',
}

/**
 * Verifica si la API Key está configurada
 */
export const isGeoapifyConfigured = (): boolean => {
  return MAPS_CONFIG.apiKey !== '' && MAPS_CONFIG.apiKey !== undefined
}

/**
 * Slug de región (lo que guarda el <select> del cotizador y lo que queda escrito en
 * `origin_address` / `destination_address`) -> nombre real de la región.
 *
 * POR QUÉ EXISTE ESTO: los slugs no son topónimos. Mandarle "metropolitana" a Geoapify
 * como nombre de región no le dice nada, así que la API descartaba la región y hacía
 * match solo por el nombre de la comuna — y varias comunas de Santiago se repiten en
 * otras regiones de Chile. "Huechuraba, metropolitana" caía en Huechuraba de
 * Panguipulli (Los Ríos), a 870 km, y el cotizador devolvía esa distancia como si nada:
 * a $900/km con 45 km libres eso son $743.490 de sobreprecio en una mudanza de 6,5 km.
 * Detectado el 2026-08-25 con la cotización de Nini (871,1 km Huechuraba -> Vitacura).
 */
export const REGION_NAMES: Record<string, string> = {
  arica: 'Región de Arica y Parinacota',
  tarapaca: 'Región de Tarapacá',
  antofagasta: 'Región de Antofagasta',
  atacama: 'Región de Atacama',
  coquimbo: 'Región de Coquimbo',
  valparaiso: 'Región de Valparaíso',
  metropolitana: 'Región Metropolitana',
  ohiggins: "Región del Libertador General Bernardo O'Higgins",
  maule: 'Región del Maule',
  nuble: 'Región de Ñuble',
  biobio: 'Región del Biobío',
  araucania: 'Región de La Araucanía',
  losrios: 'Región de Los Ríos',
  loslagos: 'Región de Los Lagos',
  aysen: 'Región de Aysén',
  magallanes: 'Región de Magallanes y de la Antártica Chilena',
}

/**
 * Nombre de región apto para geocodificar. Si no es un slug conocido se devuelve tal
 * cual: las direcciones cargadas a mano desde el panel ya vienen con el nombre escrito.
 */
export const regionName = (slug: string | null | undefined): string => {
  const raw = (slug || '').trim()
  return REGION_NAMES[raw.toLowerCase()] || raw
}


import { NextRequest, NextResponse } from 'next/server'
import { MAPS_CONFIG, regionName } from '@/config/maps'

/**
 * API Route para geocodificar direcciones usando Geoapify Geocoding
 * Esta ruta actúa como proxy para evitar problemas de CORS
 *
 * Se geocodifica en modo ESTRUCTURADO (street/housenumber/city/state/country por
 * separado) en vez de mandar una sola cadena de texto libre. Con texto libre, si
 * Geoapify no entendía alguna parte la descartaba en silencio y hacía match por lo que
 * sí reconocía — el nombre de la comuna — devolviendo una comuna homónima de otra
 * región con toda confianza. En estructurado, `state` acota la búsqueda de verdad.
 * Ver el comentario de REGION_NAMES en src/config/maps.ts para el caso que lo destapó.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { street, number, commune, region } = body

    // Validar que tenemos API key
    if (!MAPS_CONFIG.apiKey) {
      return NextResponse.json(
        { error: 'Geoapify API key not configured' },
        { status: 500 }
      )
    }

    // Validar parámetros
    if (!street || !commune || !region) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // El slug del <select> ("metropolitana") no es un topónimo; hay que traducirlo.
    const estado = regionName(region)
    const etiqueta = `${street} ${number}, ${commune}, ${estado}`

    const url = new URL(MAPS_CONFIG.geocodingUrl)
    url.searchParams.append('street', String(street))
    if (number) url.searchParams.append('housenumber', String(number))
    url.searchParams.append('city', String(commune))
    if (estado) url.searchParams.append('state', estado)
    url.searchParams.append('country', 'Chile')
    url.searchParams.append('apiKey', MAPS_CONFIG.apiKey)
    url.searchParams.append('lang', MAPS_CONFIG.language)
    url.searchParams.append('limit', '1')

    const response = await fetch(url.toString())

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Geoapify Geocoding API error:', response.status, response.statusText, errorText)
      return NextResponse.json(
        {
          error: 'Geoapify Geocoding API error',
          status: response.status,
          details: errorText
        },
        { status: 400 }
      )
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const coordinates = feature.geometry.coordinates
      const props = feature.properties || {}
      const matchType = props.rank?.match_type || 'desconocido'

      // Se deja constancia de CUÁNTO se resolvió. Un `match_by_city_or_disrict` es el
      // centroide de la comuna (aproximación aceptable de unos pocos km), no la
      // dirección exacta: si un día una distancia vuelve a verse rara, el log dice si
      // fue por esto. Un match a nivel país/región sí sería basura y se rechaza abajo.
      console.info(
        `[geocode] ${etiqueta} -> ${props.formatted || 's/d'} (${props.result_type || 's/d'} / ${matchType})`
      )

      // Guarda contra el fallo que originó todo esto: si Geoapify no logró ubicar ni
      // la comuna, devuelve el centroide del país o de la región y eso, convertido en
      // kilómetros cobrables, es un sobreprecio de cientos de miles de pesos. Vale
      // mucho más quedarse sin distancia (el cotizador cae a su valor por defecto y
      // alguien la revisa) que cobrar una inventada.
      if (props.result_type === 'country' || props.result_type === 'state') {
        console.warn(`[geocode] RECHAZADO: ${etiqueta} solo resolvió a nivel ${props.result_type}`)
        return NextResponse.json(
          { error: 'Geocoding too coarse', status: 'TOO_COARSE', resultType: props.result_type },
          { status: 400 }
        )
      }

      return NextResponse.json({
        lat: coordinates[1],
        lng: coordinates[0],
        resultType: props.result_type || null,
        matchType,
        formatted: props.formatted || null,
      })
    }

    // Si falla, retornar error con detalles
    return NextResponse.json(
      {
        error: 'Geocoding failed',
        status: 'ERROR',
        details: data
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in geocoding API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
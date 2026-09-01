import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getActorFromRequest, logAdminAction } from '@/lib/activityLog'
import { DEFAULT_CREW, DEFAULT_STAIRS } from '@/lib/crewPricing'
import { DEFAULT_EXTRA_SERVICES, withExtraServicesDefaults } from '@/lib/extraServices'

/**
 * Completa los servicios/recargos agregados en sep-2026 sobre lo que haya guardado.
 * Van dentro del JSONB `additional_services` para no necesitar migración, así que una
 * fila anterior simplemente no los trae y hay que rellenarlos al leer.
 */
function withServiceDefaults(services: unknown) {
  const s = (services || {}) as Record<string, unknown>
  return { ...s, ...withExtraServicesDefaults(s) }
}

/**
 * Normaliza los bloques nuevos (cuadrilla y escaleras) contra los valores por defecto.
 * Una fila de `pricing_config` anterior a la migración no los tiene, y sin esto el
 * cotizador quedaría dividiendo por undefined.
 */
function withCrewDefaults(crew: unknown) {
  const c = (crew || {}) as Partial<typeof DEFAULT_CREW>
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback
  return {
    includedPeople: Math.max(1, num(c.includedPeople, DEFAULT_CREW.includedPeople)),
    kgPerPerson: Math.max(1, num(c.kgPerPerson, DEFAULT_CREW.kgPerPerson)),
    pricePerExtraPerson: num(c.pricePerExtraPerson, DEFAULT_CREW.pricePerExtraPerson),
    maxPeople: Math.max(1, num(c.maxPeople, DEFAULT_CREW.maxPeople)),
  }
}

function withStairsDefaults(stairs: unknown) {
  const s = (stairs || {}) as Partial<typeof DEFAULT_STAIRS>
  const itemsPerTrip =
    typeof s.itemsPerTrip === 'number' && s.itemsPerTrip >= 1
      ? s.itemsPerTrip
      : DEFAULT_STAIRS.itemsPerTrip
  return { itemsPerTrip }
}

export async function GET() {
  try {
    // Obtener configuración de precios desde la base de datos (el más reciente)
    const { data: configs, error } = await supabaseAdmin
      .from('pricing_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching pricing config:', error)
      return NextResponse.json(
        { error: 'Error obteniendo configuración de precios' },
        { status: 500 }
      )
    }

    const config = configs?.[0]

    // Si no existe configuración, devolver valores por defecto
    if (!config) {
      const defaultConfig = {
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

      return NextResponse.json(defaultConfig)
    }

    // Transformar los datos de la BD al formato esperado por el frontend
    const transformedConfig = {
      basePrice: config.base_price,
      pricePerCubicMeter: config.price_per_cubic_meter,
      pricePerKilometer: config.price_per_kilometer,
      freeKilometers: config.free_kilometers || 50,
      floorSurcharge: config.floor_surcharge,
      additionalServices: withServiceDefaults(config.additional_services),
      specialPackaging: config.special_packaging,
      timeSurcharges: config.time_surcharges,
      discounts: config.discounts,
      crew: withCrewDefaults(config.crew_config),
      stairs: withStairsDefaults(config.stairs_config)
    }

    return NextResponse.json(transformedConfig)
  } catch (error) {
    console.error('Error in /api/admin/pricing-config:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar que todos los campos requeridos estén presentes
    const requiredFields = [
      'basePrice', 'pricePerCubicMeter', 'pricePerKilometer', 'floorSurcharge',
      'additionalServices', 'specialPackaging', 'timeSurcharges', 'discounts'
    ]

    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Campo requerido faltante: ${field}` },
          { status: 400 }
        )
      }
    }

    // Transformar los datos del frontend al formato de la BD
    const dbData = {
      base_price: body.basePrice,
      price_per_cubic_meter: body.pricePerCubicMeter,
      price_per_kilometer: body.pricePerKilometer,
      free_kilometers: body.freeKilometers || 50,
      floor_surcharge: body.floorSurcharge,
      additional_services: withServiceDefaults(body.additionalServices),
      special_packaging: body.specialPackaging,
      time_surcharges: body.timeSurcharges,
      discounts: body.discounts,
      crew_config: withCrewDefaults(body.crew),
      stairs_config: withStairsDefaults(body.stairs),
      updated_at: new Date().toISOString()
    }

    // Verificar si ya existe configuración
    const { data: existingConfig } = await supabaseAdmin
      .from('pricing_config')
      .select('id')
      .single()

    let result
    if (existingConfig) {
      // Actualizar configuración existente
      result = await supabaseAdmin
        .from('pricing_config')
        .update(dbData)
        .eq('id', existingConfig.id)
        .select()
        .single()
    } else {
      // Crear nueva configuración
      result = await supabaseAdmin
        .from('pricing_config')
        .insert({
          ...dbData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving pricing config:', result.error)
      return NextResponse.json(
        { error: 'Error guardando configuración de precios' },
        { status: 500 }
      )
    }

    await logAdminAction({
      actor: getActorFromRequest(request),
      action: 'pricing.updated',
      entityType: 'pricing',
      entityId: result.data?.id ? String(result.data.id) : null,
      entityLabel: 'Configuración de precios',
      summary: `Actualizó los precios (base $${Number(body.basePrice || 0).toLocaleString('es-CL')}, m³ $${Number(body.pricePerCubicMeter || 0).toLocaleString('es-CL')}, km $${Number(body.pricePerKilometer || 0).toLocaleString('es-CL')})`,
      // Se guarda la configuración completa: es el cambio que más impacta la facturación.
      changes: { pricing: { from: existingConfig ? 'anterior' : null, to: dbData } },
      request,
    })

    return NextResponse.json({
      success: true,
      message: 'Configuración de precios guardada exitosamente',
      data: result.data
    })
  } catch (error) {
    console.error('Error in /api/admin/pricing-config PUT:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

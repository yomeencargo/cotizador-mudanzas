import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { pickAttribution, backfillAttribution } from '@/lib/attributionServer'
import {
  buildCustomerIdentityIndex,
  normalizeCustomerEmail,
  resolveIncomingCustomerSource,
} from '@/lib/prospectSource'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      source = 'web',
      quote_id,
      name,
      email,
      phone,
      is_company = false,
      company_name,
      company_rut,
      origin_address,
      destination_address,
      origin_floor,
      origin_has_elevator,
      origin_parking_distance,
      destination_floor,
      destination_has_elevator,
      destination_parking_distance,
      visit_address,
      scheduled_date,
      scheduled_time,
      total_price,
      original_price,
      is_flexible = false,
      recommended_vehicle,
      total_volume,
      total_weight,
      total_distance,
      items_summary,
      additional_services,
    } = body

    const normalizedEmail = normalizeCustomerEmail(email)

    if (!name || !normalizedEmail || !phone) {
      return NextResponse.json(
        { error: 'Se requiere al menos nombre, email y teléfono' },
        { status: 400 }
      )
    }

    // Una nueva cotización sigue siendo una oportunidad propia, pero la persona se
    // reconoce por email. Así hereda su clasificación/frecuencia y nunca aparece como
    // un segundo cliente en las vistas consolidadas.
    const [identityResult, bookingResult] = await Promise.all([
      supabaseAdmin
        .from('quote_prospects')
        .select('email, source, status, is_frequent, converted_booking_id, lead_key')
        .eq('email', normalizedEmail),
      supabaseAdmin.from('bookings').select('id').ilike('client_email', normalizedEmail).limit(1),
    ])

    const { data: previousRows, error: identityError } = identityResult

    if (identityError) {
      console.error('[Prospects] Error resolving customer identity:', identityError)
    }
    if (bookingResult.error) {
      console.error('[Prospects] Error checking existing booking email:', bookingResult.error)
    }

    const existingIdentity = buildCustomerIdentityIndex(previousRows || []).get(normalizedEmail)
    const effectiveSource = resolveIncomingCustomerSource(source, existingIdentity)

    // Generar lead_key para upsert (evitar duplicados de la misma cotización)
    const rawKey = `${normalizedEmail}|${scheduled_date || ''}|${origin_address || ''}|${destination_address || ''}|${visit_address || ''}`
    const leadKey = crypto.createHash('md5').update(rawKey).digest('hex')

    const prospectData = {
      source: effectiveSource,
      quote_id: quote_id || null,
      name,
      email: normalizedEmail,
      phone,
      is_frequent: Boolean(existingIdentity?.isFrequent),
      is_company,
      company_name: is_company ? company_name : null,
      company_rut: is_company ? company_rut : null,
      origin_address: origin_address || null,
      destination_address: destination_address || null,
      origin_floor: origin_floor ?? null,
      origin_has_elevator: origin_has_elevator ?? null,
      origin_parking_distance: origin_parking_distance ?? null,
      destination_floor: destination_floor ?? null,
      destination_has_elevator: destination_has_elevator ?? null,
      destination_parking_distance: destination_parking_distance ?? null,
      visit_address: visit_address || null,
      scheduled_date: scheduled_date || null,
      scheduled_time: scheduled_time || null,
      total_price: total_price || null,
      original_price: original_price || null,
      is_flexible,
      recommended_vehicle: recommended_vehicle || null,
      total_volume: total_volume || null,
      total_weight: total_weight || null,
      total_distance: total_distance || null,
      items_summary: items_summary || null,
      additional_services: additional_services || null,
      lead_key: leadKey,
      updated_at: new Date().toISOString(),
    }

    // Upsert: si ya existe un lead con la misma key, actualizar en vez de duplicar
    const { data: prospect, error: upsertError } = await supabaseAdmin
      .from('quote_prospects')
      .upsert(prospectData, {
        onConflict: 'lead_key',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (upsertError) {
      console.error('[Prospects] Error upserting prospect:', upsertError)
      return NextResponse.json({ error: 'Error al guardar el prospecto' }, { status: 500 })
    }

    // Atribucion de Google Ads: se guarda aparte del upsert para NO sobrescribir un
    // gclid ya guardado en re-guardados del mismo prospecto (first-touch por fila).
    await backfillAttribution('quote_prospects', prospect.id, pickAttribution(body), prospect)

    return NextResponse.json(
      {
        success: true,
        prospectId: prospect.id,
        existingCustomer:
          Boolean(existingIdentity?.isCustomer) || Boolean(bookingResult.data?.length),
        customerOrigin: existingIdentity?.origin || effectiveSource,
        message: 'Prospecto guardado exitosamente',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Prospects] Error in /api/prospects/create:', error)
    return NextResponse.json({ error: 'Error al guardar el prospecto' }, { status: 500 })
  }
}

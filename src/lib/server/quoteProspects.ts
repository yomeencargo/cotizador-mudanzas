/**
 * GUARDAR UNA COTIZACIÓN COMO PROSPECTO — una sola función para la web y el panel.
 *
 * Vivía dentro de `/api/prospects/create`. El cotizador interno del panel necesita
 * exactamente lo mismo (misma identidad por email, mismo `lead_key`, mismos campos), con
 * una sola diferencia: puede fijar un precio final distinto del calculado. Si cada ruta
 * tuviera su upsert, la ficha de una misma persona dependería de quién la cargó.
 *
 * Los precios:
 *  - `total_price` es SIEMPRE lo que calculó el cotizador (el «precio calculado»).
 *  - `adjusted_price` es el precio final cuando alguien lo cambió a mano; `null` si no.
 *  Todo lo que le habla al cliente ya lee `adjusted_price ?? total_price` (secuencia de
 *  correos, PDF del panel, reenvío de la cotización), así que no hizo falta una columna
 *  nueva para el precio final.
 */

import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import {
  buildCustomerIdentityIndex,
  normalizeCustomerEmail,
  resolveIncomingCustomerSource,
} from '@/lib/prospectSource'
import { normalizeStops } from '@/lib/stops'

export class QuoteProspectInputError extends Error {}

export interface UpsertQuoteProspectResult {
  prospect: Record<string, any>
  existingCustomer: boolean
  customerOrigin: string
}

export async function upsertQuoteProspect(
  body: Record<string, any>,
  /**
   * Solo el panel lo pasa. `adjusted_price` se escribe SIEMPRE que venga (también `null`),
   * para que una cotización nueva sin ajuste no herede el precio ajustado de una anterior
   * con el mismo `lead_key`. La web no lo pasa y nunca toca esas columnas.
   */
  adjustment?: { adjusted_price: number | null; adjustment_comment: string | null }
): Promise<UpsertQuoteProspectResult> {
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
    stops,
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
    throw new QuoteProspectInputError('Se requiere al menos nombre, email y teléfono')
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
    // Paradas intermedias. `normalizeStops` descarta las incompletas: una parada sin
    // dirección no se puede recorrer ni mostrar, y guardarla ensucia la ruta.
    stops: normalizeStops(stops).length ? normalizeStops(stops) : null,
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
    ...(adjustment
      ? {
          adjusted_price: adjustment.adjusted_price,
          adjustment_comment: adjustment.adjustment_comment,
        }
      : {}),
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

  if (upsertError || !prospect) {
    console.error('[Prospects] Error upserting prospect:', upsertError)
    throw new Error('Error al guardar el prospecto')
  }

  return {
    prospect,
    existingCustomer: Boolean(existingIdentity?.isCustomer) || Boolean(bookingResult.data?.length),
    customerOrigin: existingIdentity?.origin || effectiveSource,
  }
}

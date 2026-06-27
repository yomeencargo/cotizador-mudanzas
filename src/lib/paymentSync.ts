import { supabaseAdmin } from '@/lib/supabase'
import { flowService, type FlowPaymentStatus } from '@/lib/flowService'

/**
 * Datos mínimos de la reserva que necesitan los endpoints de pago para redirigir
 * al usuario (página de éxito online vs domicilio) y para convertir el prospecto.
 */
export interface SyncedBookingData {
  id: string
  booking_type?: string | null
  client_name?: string | null
  client_email?: string | null
  visit_address?: string | null
  payment_status?: string | null
}

export interface ApplyFlowPaymentResult {
  paymentStatus: FlowPaymentStatus
  /** La reserva (datos previos al update). null si no se encontró por quote_id. */
  bookingData: SyncedBookingData | null
  /** quote_id estable con el que se resolvió la reserva. */
  bookingRef: string
  /** true si la reserva ya estaba aprobada antes de este token (no se re-procesó el prospecto). */
  alreadyProcessed: boolean
}

/**
 * Fuente ÚNICA de verdad para aplicar el resultado de un pago de Flow a la reserva.
 *
 * La usan por igual el webhook server-to-server (`/api/payment/confirm`) y el retorno del
 * navegador (`/api/payment/result`), de modo que ambos hagan EXACTAMENTE lo mismo.
 *
 * Resuelve la reserva por `optional.bookingId` (el quote_id estable) con fallback al
 * `commerceOrder`. Esto corrige el bug donde `result` buscaba por `commerceOrder`
 * (`Q-123-mitad-1718...`) y nunca encontraba la reserva (`quote_id = Q-123`), dejándola
 * "pendiente" si el webhook tardaba o fallaba.
 *
 * Idempotente: si la reserva ya estaba `payment_status='approved'`, el UPDATE es inofensivo
 * y la conversión del prospecto (con efectos colaterales) NO se repite.
 */
export async function applyFlowPaymentByToken(
  token: string
): Promise<ApplyFlowPaymentResult> {
  const paymentStatus = await flowService.getPaymentStatus(token)

  // Referencia estable de la reserva: optional.bookingId siempre es el quote_id original,
  // sin importar cuántas órdenes (50% correo, 50% página, 100%) se hayan generado.
  let optionalBookingId: string | undefined
  let optionalPaymentType: string | undefined
  if (paymentStatus.optional) {
    try {
      const optional = JSON.parse(paymentStatus.optional)
      optionalBookingId = optional.bookingId
      optionalPaymentType = optional.paymentType
    } catch (e) {
      console.error('[paymentSync] Error parsing optional data:', e)
    }
  }
  const bookingRef = optionalBookingId || paymentStatus.commerceOrder

  // Leer la reserva ANTES de actualizar: sirve para idempotencia y para redirigir/convertir.
  const { data: existing } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_type, client_name, client_email, visit_address, payment_status')
    .eq('quote_id', bookingRef)
    .maybeSingle()

  const bookingData = (existing as SyncedBookingData | null) || null
  const alreadyApproved = bookingData?.payment_status === 'approved'

  // Flow status: 1 = pending, 2 = approved, 3 = rejected, 4 = cancelled
  let paymentStatusStr = 'pending'
  if (paymentStatus.status === 2) paymentStatusStr = 'approved'
  else if (paymentStatus.status === 3) paymentStatusStr = 'rejected'
  else if (paymentStatus.status === 4) paymentStatusStr = 'cancelled'

  const updateData: Record<string, any> = {
    flow_token: token,
    flow_order: paymentStatus.flowOrder,
    payment_status: paymentStatusStr,
    payment_date: paymentStatus.paymentData?.date || new Date().toISOString(),
    payment_method: paymentStatus.paymentData?.media || 'unknown',
  }

  if (paymentStatus.status === 2) {
    updateData.status = 'confirmed'
    // Deja de ser provisional => ahora SÍ consume cupo de flota.
    updateData.is_provisional = false
    if (paymentStatus.amount) updateData.total_price = paymentStatus.amount
    if (optionalPaymentType) updateData.payment_type = optionalPaymentType
  } else if (paymentStatus.status === 3 || paymentStatus.status === 4) {
    updateData.status = 'cancelled'
  }

  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update(updateData)
    .eq('quote_id', bookingRef)

  if (updateError) {
    console.error('[paymentSync] Error updating booking:', updateError)
  } else {
    console.log(`[paymentSync] Booking ${bookingRef} -> status:${updateData.status}, payment:${paymentStatusStr}`)
  }

  // Idempotencia: si ya estaba aprobada, no repetimos la conversión del prospecto.
  const alreadyProcessed = alreadyApproved && paymentStatus.status === 2

  if (paymentStatus.status === 2 && !alreadyProcessed && bookingData?.id) {
    await convertProspectForBooking(bookingRef, bookingData.id, bookingData.client_email || null)
  }

  return { paymentStatus, bookingData, bookingRef, alreadyProcessed }
}

/**
 * Marca el prospecto correspondiente como convertido cuando el pago se aprueba.
 * 1) Por quote_id (estable) => funciona aunque el lead ya esté 'contacted'.
 * 2) Fallback por email al lead más reciente sin convertir.
 */
async function convertProspectForBooking(
  bookingRef: string,
  bookingRowId: string,
  clientEmail: string | null
): Promise<void> {
  try {
    const nowIso = new Date().toISOString()

    const { data: byQuote, error: byQuoteErr } = await supabaseAdmin
      .from('quote_prospects')
      .update({
        status: 'converted',
        converted_booking_id: bookingRowId,
        updated_at: nowIso,
      })
      .eq('quote_id', bookingRef)
      .in('status', ['new', 'contacted'])
      .select('id')

    if (byQuoteErr) {
      console.error('[paymentSync] Error converting prospect by quote_id:', byQuoteErr)
    }

    if ((!byQuote || byQuote.length === 0) && clientEmail) {
      const { data: latest } = await supabaseAdmin
        .from('quote_prospects')
        .select('id')
        .eq('email', clientEmail)
        .in('status', ['new', 'contacted'])
        .order('created_at', { ascending: false })
        .limit(1)

      const pid = latest?.[0]?.id
      if (pid) {
        await supabaseAdmin
          .from('quote_prospects')
          .update({
            status: 'converted',
            converted_booking_id: bookingRowId,
            updated_at: nowIso,
          })
          .eq('id', pid)
      }
    }

    console.log(`[paymentSync] Prospect conversion processed for: ${clientEmail}`)
  } catch (prospectErr) {
    console.error('[paymentSync] Exception updating prospect:', prospectErr)
  }
}

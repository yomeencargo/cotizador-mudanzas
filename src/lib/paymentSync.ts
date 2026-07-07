import { supabaseAdmin } from '@/lib/supabase'
import { flowService, type FlowPaymentStatus } from '@/lib/flowService'
import { postQuoteWebhook } from '@/lib/n8nClient'

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
    await notifyAdminPaymentApproved({
      bookingRef,
      clientName: bookingData.client_name || null,
      amount: paymentStatus.amount || null,
      paymentType: optionalPaymentType || null,
    })
  }

  return { paymentStatus, bookingData, bookingRef, alreadyProcessed }
}

/**
 * Avisa al dueño (por correo, vía el mismo webhook de n8n que manda las cotizaciones)
 * que se aprobó un pago. Antes esto no existía: había que revisar Flow manualmente para
 * notar que alguien pagó el abono del 50% y así poder coordinar la reserva.
 * Best-effort: si n8n falla, no bloquea ni revierte el pago ya procesado.
 */
async function notifyAdminPaymentApproved(params: {
  bookingRef: string
  clientName: string | null
  amount: number | null
  paymentType: string | null
}): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!adminEmail) return

  await postQuoteWebhook(
    {
      event: 'payment_approved',
      to: adminEmail,
      quote_id: params.bookingRef,
      cliente: params.clientName,
      monto: params.amount,
      tipo_pago: params.paymentType === 'mitad' ? 'Abono 50%' : 'Pago completo',
      fecha: new Date().toISOString(),
    },
    { label: 'admin-notify', timeoutMs: 8000 }
  )
}

/**
 * Marca los prospectos correspondientes como convertidos cuando el pago se aprueba.
 *
 * El pago es la fuente de verdad: un lead pagado deja de ser prospecto sin importar
 * el estado manual que tuviera (new/contacted/no_response/lost).
 *
 * 1) Por quote_id (estable) => cubre el caso normal del cotizador web.
 * 2) Por email => la misma persona suele tener varias filas de lead (cada re-cotización
 *    con otra fecha/dirección genera otro lead_key). Al pagar, TODAS sus filas abiertas
 *    se cierran como 'converted' para que no queden huérfanas en el panel de Prospectos.
 */
async function convertProspectForBooking(
  bookingRef: string,
  bookingRowId: string,
  clientEmail: string | null
): Promise<void> {
  try {
    const convertedFields = {
      status: 'converted',
      converted_booking_id: bookingRowId,
      updated_at: new Date().toISOString(),
    }

    const { data: byQuote, error: byQuoteErr } = await supabaseAdmin
      .from('quote_prospects')
      .update(convertedFields)
      .eq('quote_id', bookingRef)
      .neq('status', 'converted')
      .select('id')

    if (byQuoteErr) {
      console.error('[paymentSync] Error converting prospect by quote_id:', byQuoteErr)
    }

    let byEmailCount = 0
    if (clientEmail) {
      const { data: byEmail, error: byEmailErr } = await supabaseAdmin
        .from('quote_prospects')
        .update(convertedFields)
        .eq('email', clientEmail.toLowerCase().trim())
        .neq('status', 'converted')
        .select('id')

      if (byEmailErr) {
        console.error('[paymentSync] Error converting prospects by email:', byEmailErr)
      }
      byEmailCount = byEmail?.length || 0
    }

    console.log(
      `[paymentSync] Prospect conversion for ${bookingRef} (${clientEmail}): ` +
        `${byQuote?.length || 0} by quote_id, ${byEmailCount} by email`
    )
  } catch (prospectErr) {
    console.error('[paymentSync] Exception updating prospect:', prospectErr)
  }
}

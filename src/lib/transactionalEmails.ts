/**
 * Correos que nacen de un hecho puntual y no de un barrido: hoy solo el #05.
 *
 * Vive acá y no dentro de la ruta del cron porque tiene DOS llamadores que deben
 * mandar exactamente lo mismo: `paymentSync` al aprobarse el pago (el camino normal,
 * inmediato) y el cron como red de seguridad (por si n8n estaba caído en ese momento).
 * Si estuviera duplicado, tarde o temprano los dos correos dirían cosas distintas.
 */

import { supabaseAdmin } from '@/lib/supabase'
import { computeQuoteAmounts } from '@/lib/quoteCheckout'
import { bookingScope, claimAndSend, type SendOutcome } from '@/lib/emailLog'

/**
 * #05 Reserva confirmada. Idempotente por la clave de `email_log`: da igual cuántas
 * veces lo llamen paymentSync y el cron, el cliente lo recibe una sola vez.
 *
 * `transactional`: es el comprobante de algo que la persona acaba de pagar. No se le
 * retiene porque sean las 23:00 ni porque ya llevara 8 correos en el mes.
 */
export async function sendBookingConfirmed(bookingId: string): Promise<SendOutcome> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      `id, quote_id, client_name, client_email, client_phone, scheduled_date,
       scheduled_time, origin_address, destination_address, total_price,
       payment_type, payment_date`
    )
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error(`[transactionalEmails] No se encontró la reserva ${bookingId}:`, error)
    return { outcome: 'deferred', reason: 'no_recipient' }
  }

  const amounts = computeQuoteAmounts(data.total_price || 0)

  return claimAndSend({
    emailType: '05_booking_confirmed',
    recipient: data.client_email,
    scopeKey: bookingScope(data.id),
    scheduledFor: data.payment_date || new Date().toISOString(),
    bookingId: data.id,
    transactional: true,
    payload: {
      event: 'booking_confirmed',
      quote_id: data.quote_id,
      booking_id: data.id,
      cliente: {
        nombre: data.client_name,
        email: data.client_email,
        telefono: data.client_phone,
      },
      reserva: {
        fecha: data.scheduled_date,
        hora: data.scheduled_time,
        origen: data.origin_address,
        destino: data.destination_address,
        precio_total: amounts.estimated,
      },
      pago: {
        tipo: data.payment_type === 'mitad' ? 'Abono 50%' : 'Pago completo',
        // Con abono del 50%, lo que queda por pagar al terminar el traslado.
        saldo_pendiente: data.payment_type === 'mitad' ? amounts.abono50 : 0,
      },
    },
  })
}

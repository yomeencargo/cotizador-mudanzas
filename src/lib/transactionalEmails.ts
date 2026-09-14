/**
 * Correos que nacen de un hecho puntual y no de un barrido: hoy solo el #05.
 *
 * Vive acá y no dentro de la ruta del cron porque tiene VARIOS llamadores que deben
 * mandar exactamente lo mismo: `paymentSync` al aprobarse el pago (el camino web,
 * inmediato), las rutas del panel que crean o confirman una reserva a mano, y el cron
 * como red de seguridad (por si n8n estaba caído en ese momento). Si estuviera
 * duplicado, tarde o temprano los correos dirían cosas distintas.
 */

import { supabaseAdmin } from '@/lib/supabase'
import { bookingScope, claimAndSend, type SendOutcome } from '@/lib/emailLog'
import { actualPaidAmount, pendingAmount, servicePrice } from '@/lib/revenueBreakdown'
import { chileTodayString } from '@/lib/vehicleAssignment'

const BOOKING_CONFIRMED_FIELDS = `id, quote_id, client_name, client_email, client_phone, scheduled_date,
  scheduled_time, origin_address, destination_address, total_price, original_price,
  adjusted_price, amount_paid, payment_type, payment_status, payment_date, status,
  is_provisional, flow_token`

/**
 * #05 Reserva confirmada. Idempotente por la clave de `email_log`: da igual cuántas
 * veces lo llamen paymentSync, el panel y el cron, el cliente lo recibe una sola vez.
 *
 * `transactional`: es el comprobante de una reserva que acaba de entrar. No se le
 * retiene porque sean las 23:00 ni porque ya llevara 8 correos en el mes.
 *
 * Los montos salen de `revenueBreakdown`, los mismos que muestra el panel en «Falta
 * cobrar». Antes el saldo se deducía del tipo de pago (`mitad` = 50%), que en la web es
 * cierto pero en una reserva manual no: ahí se registra lo cobrado de verdad, que puede
 * ser un abono de $30.000 o nada. Con la deducción vieja, un cliente que no pagó habría
 * leído «Recibimos tu pago».
 */
export async function sendBookingConfirmed(bookingId: string): Promise<SendOutcome> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(BOOKING_CONFIRMED_FIELDS)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    console.error(`[transactionalEmails] No se encontró la reserva ${bookingId}:`, error)
    return { outcome: 'deferred', reason: 'no_recipient' }
  }

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
        precio_total: servicePrice(data),
      },
      pago: {
        tipo: data.payment_type === 'mitad' ? 'Abono 50%' : 'Pago completo',
        // Lo cobrado de verdad. 0 = la reserva entró sin pago: la plantilla no dice
        // «Recibimos tu pago» y avisa el monto pendiente.
        pagado: actualPaidAmount(data),
        // Lo que queda por cobrar. Quien pagó completo no debe nada: el 5% es descuento.
        saldo_pendiente: pendingAmount(data),
      },
    },
  })
}

/** Lo mínimo de una reserva para decidir si le corresponde el #05 por el camino manual. */
export interface BookingConfirmedCandidate {
  quote_id?: string | null
  client_email?: string | null
  scheduled_date?: string | null
  status?: string | null
  payment_status?: string | null
  is_provisional?: boolean | null
}

export type BookingConfirmedSkip =
  | 'bloqueo'
  | 'email_invalido'
  | 'estado_cerrado'
  | 'pre_reserva'
  | 'no_confirmada'
  | 'fecha_pasada'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * ¿Por qué NO mandarle el #05 a una reserva que entró por el panel? `null` = sí va.
 *
 * Cada guarda sale de medir las reservas manuales de producción el 14-sep-2026:
 *  - 9 de 98 tienen en `client_email` un nombre o una palabra ('sinnumero', 'dorca').
 *  - Solo 17 de 98 son para una fecha futura: el panel se usa mucho para registrar
 *    mudanzas que ya pasaron, y «tu mudanza del 3 de marzo está confirmada» sería absurdo.
 *  - Los bloqueos de agenda son reservas con `ADMIN-BLOQUEO-` y un correo de example.com.
 *  - El modal de Nueva Reserva nace en `pending`: eso es tentativo, no un ingreso. Entra
 *    cuando se confirma o cuando el pago queda aprobado (7 manuales están pagadas y
 *    siguen en `pending`).
 */
export function bookingConfirmedSkipReason(
  b: BookingConfirmedCandidate,
  today: string = chileTodayString()
): BookingConfirmedSkip | null {
  const email = String(b.client_email || '').trim()
  if (String(b.quote_id || '').startsWith('ADMIN-BLOQUEO-') || /@example\.com$/i.test(email)) {
    return 'bloqueo'
  }
  if (!EMAIL_RE.test(email)) return 'email_invalido'
  const status = String(b.status || '')
  if (['cancelled', 'no_show', 'completed'].includes(status)) return 'estado_cerrado'
  if (b.is_provisional) return 'pre_reserva'
  if (status !== 'confirmed' && b.payment_status !== 'approved') return 'no_confirmada'
  if (!b.scheduled_date || b.scheduled_date < today) return 'fecha_pasada'
  return null
}

/**
 * #05 para una reserva que entró o se confirmó desde el panel.
 *
 * Nunca lanza: la reserva ya está creada y un correo caído no puede convertirse en un
 * error para el administrador. Si falla, el cron lo reintenta dentro de las 24 h.
 */
export async function sendBookingConfirmedIfEligible(
  bookingId: string
): Promise<SendOutcome | { outcome: 'skipped'; reason: BookingConfirmedSkip }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(BOOKING_CONFIRMED_FIELDS)
      .eq('id', bookingId)
      .maybeSingle()

    if (error || !data) {
      console.error(`[transactionalEmails] No se encontró la reserva ${bookingId}:`, error)
      return { outcome: 'deferred', reason: 'no_recipient' }
    }

    const skip = bookingConfirmedSkipReason(data)
    if (skip) {
      console.info(`[transactionalEmails] #05 no corresponde a ${data.quote_id}: ${skip}`)
      return { outcome: 'skipped', reason: skip }
    }

    return await sendBookingConfirmed(bookingId)
  } catch (e) {
    console.error(`[transactionalEmails] Error enviando el #05 de ${bookingId}:`, e)
    return { outcome: 'deferred', reason: 'no_recipient' }
  }
}

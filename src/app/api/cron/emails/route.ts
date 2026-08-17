import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { flowService } from '@/lib/flowService'
import { computeQuoteAmounts, createQuoteFlowOrder } from '@/lib/quoteCheckout'
import { chileTodayString } from '@/lib/vehicleAssignment'
import { sendBookingConfirmed } from '@/lib/transactionalEmails'
import {
  bookingScope,
  claimAndSend,
  emailGatesStatus,
  isWithinSendWindow,
  markSuperseded,
  type SendOutcome,
  type SkipReason,
} from '@/lib/emailLog'

/**
 * Cron de correos automáticos. Fase 1: #05 reserva confirmada (red de seguridad),
 * #06 falta tu pago, #06b recuperación de impagos vencidos, #07 pago rechazado.
 *
 * ES UN RECONCILIADOR, NO UNA COLA. Cada corrida deriva qué corresponde enviar del
 * estado ACTUAL de `bookings`; `email_log` solo dice qué ya se envió. Por eso las
 * reservas impagas que existían desde antes del sistema quedan cubiertas sin ningún
 * script de backfill — y ese script era justamente el peligroso, porque el filtro que
 * protege al flujo nuevo es el mismo que las protege a ellas.
 *
 * El corte de secuencia sale gratis: al pagarse, la reserva deja de cumplir el WHERE
 * y no genera más candidatos. El `precheck` de cada envío cubre el caso de que el pago
 * entre entre que se eligió al candidato y el momento de postear a n8n.
 */

/** Los tres tramos del #06, medidos desde la creación de la reserva. */
const PAYMENT_DUE_STEPS = [
  { key: '2h', hours: 2 },
  { key: '24h', hours: 24 },
  { key: '72h', hours: 72 },
] as const

/** Más allá de esto una reserva impaga ya no se persigue con el #06. */
const PAYMENT_DUE_MAX_AGE_DAYS = 30
/** Piso del #06b: no se le escribe a alguien por una cotización de hace medio año. */
const RECOVERY_MAX_AGE_DAYS = 180
/** Ventana del #07 tras el rechazo de Flow. */
const REJECTED_WINDOW_HOURS = 48
/** Ventana de la red de seguridad del #05. */
const CONFIRMED_WINDOW_HOURS = 24

const BOOKING_FIELDS = `
  id, quote_id, client_name, client_email, client_phone,
  scheduled_date, scheduled_time, origin_address, destination_address,
  total_price, payment_type, payment_status, payment_date, status, created_at
`

interface BookingRow {
  id: string
  quote_id: string
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  origin_address: string | null
  destination_address: string | null
  total_price: number | null
  payment_type: string | null
  payment_status: string | null
  payment_date: string | null
  status: string | null
  created_at: string
}

type Tally = Record<string, number>

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (60 * 60 * 1000)
}

function tallyUp(tally: Tally, emailType: string, outcome: SendOutcome): void {
  // El motivo se incluye también para 'deferred'. Agruparlos costó cinco días de
  // no poder distinguir "el envío está apagado" de "la lista blanca lo filtró":
  // los dos casos no dejan fila en email_log, así que el contador es la ÚNICA
  // señal disponible desde afuera.
  const reason =
    outcome.outcome === 'skipped' || outcome.outcome === 'deferred' ? `:${outcome.reason}` : ''
  tally[`${emailType}.${outcome.outcome}${reason}`] = (tally[`${emailType}.${outcome.outcome}${reason}`] || 0) + 1
}

function clientBlock(b: BookingRow) {
  return {
    nombre: b.client_name,
    email: b.client_email,
    telefono: b.client_phone,
  }
}

function bookingBlock(b: BookingRow) {
  return {
    fecha: b.scheduled_date,
    hora: b.scheduled_time,
    origen: b.origin_address,
    destino: b.destination_address,
    precio_total: b.total_price,
  }
}

/**
 * Emite una orden de pago NUEVA para el abono del 50%.
 *
 * No se reusa `flow_token`: está NULL en todas las reservas impagas (nunca llegaron a
 * pagar) y los links de Flow caducan igual. `optional.bookingId` va con el quote_id,
 * así que cuando el cliente pague, `paymentSync` resuelve la misma reserva de siempre
 * sin importar cuántas órdenes se hayan generado para ella.
 *
 * Lanza si Flow no está disponible: un "falta tu pago" sin link no sirve de nada, y
 * fallar deja la fila reintentable en la próxima corrida en vez de quemar la clave.
 */
async function freshPaymentUrl(b: BookingRow): Promise<string> {
  if (!flowService.isConfigured()) throw new Error('Flow no está configurado')
  if (!b.client_email) throw new Error('la reserva no tiene email')

  const amounts = computeQuoteAmounts(b.total_price || 0)
  const order = await createQuoteFlowOrder({
    quoteId: b.quote_id,
    paymentType: 'mitad',
    amount: amounts.abono50,
    email: b.client_email,
    subject: 'Servicio de Mudanza - Abono 50%',
  })
  return order.url
}

/**
 * Revalida contra la base justo antes de postear a n8n. Corta la secuencia si la
 * reserva dejó de estar en el estado que la hizo candidata.
 */
function stillMatches(bookingId: string, expected: string) {
  return async (): Promise<SkipReason | null> => {
    const { data } = await supabaseAdmin
      .from('bookings')
      .select('payment_status')
      .eq('id', bookingId)
      .maybeSingle()
    return data?.payment_status === expected ? null : 'converted'
  }
}

// ---------------------------------------------------------------------------
// #06 — Falta tu pago (+2 h / +24 h / +72 h)
// ---------------------------------------------------------------------------

async function rulePaymentDue(tally: Tally): Promise<void> {
  // Los tres filtros que evitan el desastre: `status='pending'` deja fuera las
  // canceladas y las que YA SE ATENDIERON sin registrar el pago; `scheduled_date >= hoy`
  // deja fuera las mudanzas que ya ocurrieron; y los 30 días acotan el resto.
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(BOOKING_FIELDS)
    .eq('payment_status', 'pending')
    .eq('status', 'pending')
    .gte('scheduled_date', chileTodayString())
    .gt('created_at', hoursAgo(PAYMENT_DUE_MAX_AGE_DAYS * 24))
    .not('client_email', 'is', null)

  if (error) {
    console.error('[cron/emails] Error buscando impagas vigentes:', error)
    return
  }

  for (const b of (data || []) as BookingRow[]) {
    const age = hoursSince(b.created_at)
    const due = PAYMENT_DUE_STEPS.filter((s) => age >= s.hours)
    if (due.length === 0) continue

    // Solo sale el tramo MÁS ALTO vencido. Sin esto, cualquier reserva de más de
    // 72 h dispararía el +2h, el +24h y el +72h en la misma corrida.
    const top = due[due.length - 1]
    for (const skipped of due.slice(0, -1)) {
      await markSuperseded(
        `06_payment_due_${skipped.key}`,
        b.client_email || '',
        bookingScope(b.id),
        new Date(new Date(b.created_at).getTime() + skipped.hours * 3600_000)
      )
    }

    const emailType = `06_payment_due_${top.key}`
    const outcome = await claimAndSend({
      emailType,
      recipient: b.client_email,
      scopeKey: bookingScope(b.id),
      scheduledFor: new Date(new Date(b.created_at).getTime() + top.hours * 3600_000),
      bookingId: b.id,
      precheck: stillMatches(b.id, 'pending'),
      payload: async () => ({
        event: 'payment_due',
        step: top.key,
        quote_id: b.quote_id,
        booking_id: b.id,
        cliente: clientBlock(b),
        reserva: bookingBlock(b),
        pago: {
          flow_payment_url: await freshPaymentUrl(b),
          monto: computeQuoteAmounts(b.total_price || 0).abono50,
          tipo: 'abono_50',
        },
      }),
    })
    tallyUp(tally, emailType, outcome)
  }
}

// ---------------------------------------------------------------------------
// #06b — Recuperación de impagos cuya fecha ya pasó
// ---------------------------------------------------------------------------

/**
 * Complemento exacto del #06 (`scheduled_date <` en vez de `>=`), así que ninguna
 * reserva puede recibir los dos. Un solo disparo, sin secuencia y SIN link de pago:
 * el precio y la fecha ya no valen, el CTA es volver a cotizar.
 *
 * Detrás de EMAIL_RECOVERY_ENABLED porque es un envío de una vez sobre una lista
 * histórica, no un flujo permanente. Después del primer disparo, la clave única de
 * `email_log` lo hace irrepetible aunque la variable quede encendida.
 */
async function ruleRecovery(tally: Tally): Promise<void> {
  if (process.env.EMAIL_RECOVERY_ENABLED !== '1') return

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(BOOKING_FIELDS)
    .eq('payment_status', 'pending')
    .eq('status', 'pending')
    .lt('scheduled_date', chileTodayString())
    .gt('created_at', hoursAgo(RECOVERY_MAX_AGE_DAYS * 24))
    .not('client_email', 'is', null)

  if (error) {
    console.error('[cron/emails] Error buscando impagas vencidas:', error)
    return
  }

  for (const b of (data || []) as BookingRow[]) {
    const outcome = await claimAndSend({
      emailType: '06b_recovery',
      recipient: b.client_email,
      scopeKey: bookingScope(b.id),
      scheduledFor: new Date(),
      bookingId: b.id,
      precheck: stillMatches(b.id, 'pending'),
      payload: {
        event: 'quote_recovery',
        quote_id: b.quote_id,
        booking_id: b.id,
        cliente: clientBlock(b),
        reserva: bookingBlock(b),
        cotizador_url: process.env.NEXT_PUBLIC_APP_URL || 'https://yomeencargo.cl',
      },
    })
    tallyUp(tally, '06b_recovery', outcome)
  }
}

// ---------------------------------------------------------------------------
// #07 — Pago rechazado
// ---------------------------------------------------------------------------

/**
 * Único de la Fase 1 que NO filtra por `status='pending'`: `paymentSync` deja las
 * reservas rechazadas en `status='cancelled'`, así que exigirlo las dejaría a todas
 * fuera. Reviven bien (eran provisionales, no consumían cupo), pero OJO: el webhook
 * no revalida el cupo al re-aprobar, así que si el horario se llenó mientras tanto
 * pueden quedar dos reservas en el mismo bloque. Riesgo conocido, no resuelto acá.
 */
async function rulePaymentRejected(tally: Tally): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(BOOKING_FIELDS)
    .eq('payment_status', 'rejected')
    .gt('payment_date', hoursAgo(REJECTED_WINDOW_HOURS))
    .not('client_email', 'is', null)

  if (error) {
    console.error('[cron/emails] Error buscando pagos rechazados:', error)
    return
  }

  for (const b of (data || []) as BookingRow[]) {
    const outcome = await claimAndSend({
      emailType: '07_payment_rejected',
      recipient: b.client_email,
      scopeKey: bookingScope(b.id),
      scheduledFor: b.payment_date || new Date().toISOString(),
      bookingId: b.id,
      transactional: true,
      precheck: stillMatches(b.id, 'rejected'),
      payload: async () => ({
        event: 'payment_rejected',
        quote_id: b.quote_id,
        booking_id: b.id,
        cliente: clientBlock(b),
        reserva: bookingBlock(b),
        pago: {
          flow_payment_url: await freshPaymentUrl(b),
          monto: computeQuoteAmounts(b.total_price || 0).abono50,
          tipo: 'abono_50',
        },
      }),
    })
    tallyUp(tally, '07_payment_rejected', outcome)
  }
}

// ---------------------------------------------------------------------------
// #05 — Reserva confirmada (red de seguridad)
// ---------------------------------------------------------------------------

/**
 * El #05 se manda en línea desde `paymentSync` al aprobarse el pago. Esto es solo la
 * red: cubre que n8n estuviera caído en ese momento, o que la reserva se haya
 * rescatado por otro camino. Si el envío en línea funcionó, la clave ya está tomada
 * y esto no hace nada.
 */
async function ruleBookingConfirmedSafetyNet(tally: Tally): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(BOOKING_FIELDS)
    .eq('payment_status', 'approved')
    .gt('payment_date', hoursAgo(CONFIRMED_WINDOW_HOURS))
    .not('client_email', 'is', null)

  if (error) {
    console.error('[cron/emails] Error buscando reservas confirmadas:', error)
    return
  }

  for (const b of (data || []) as BookingRow[]) {
    tallyUp(tally, '05_booking_confirmed', await sendBookingConfirmed(b.id))
  }
}

// ---------------------------------------------------------------------------
// Orquestación
// ---------------------------------------------------------------------------

async function runEmailCron(force: boolean): Promise<Record<string, unknown>> {
  // Los transaccionales que nacen de una acción del cliente salen igual por su propia
  // vía (el #05 en línea desde paymentSync). Acá, fuera de horario, no se barre nada:
  // ninguna de estas reglas es tan urgente como para escribirle a alguien a las 03:00.
  if (!force && !isWithinSendWindow()) {
    return { skipped: 'quiet_hours', window: '09:00-21:00 America/Santiago', config: emailGatesStatus() }
  }

  const tally: Tally = {}
  await ruleBookingConfirmedSafetyNet(tally)
  await rulePaymentDue(tally)
  await ruleRecovery(tally)
  await rulePaymentRejected(tally)

  const sent = Object.entries(tally)
    .filter(([k]) => k.endsWith('.sent'))
    .reduce((n, [, v]) => n + v, 0)

  console.log(`[cron/emails] ${sent} enviados. Detalle: ${JSON.stringify(tally)}`)
  return { sent, detail: tally, config: emailGatesStatus() }
}

/** Disparo automático por Vercel Cron. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  try {
    return NextResponse.json({ success: true, ...(await runEmailCron(false)) })
  } catch (error) {
    console.error('[cron/emails] Exception:', error)
    return NextResponse.json(
      { error: 'Error en el cron de correos', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

/**
 * Disparo manual. `?force=1` ignora la ventana horaria para poder probar a cualquier
 * hora — no salta ni el dry-run ni la lista blanca, que son las que protegen de verdad.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  const force = new URL(request.url).searchParams.get('force') === '1'
  try {
    return NextResponse.json({ success: true, ...(await runEmailCron(force)) })
  } catch (error) {
    console.error('[cron/emails] Exception:', error)
    return NextResponse.json(
      { error: 'Error en el cron de correos', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

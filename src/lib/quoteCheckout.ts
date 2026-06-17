import { supabaseAdmin } from '@/lib/supabase'
import { flowService, type FlowPaymentResponse } from '@/lib/flowService'

export type PaymentType = 'completo' | 'mitad'

export interface QuoteClient {
  name?: string
  email?: string
  phone?: string
  isCompany?: boolean
  companyName?: string | null
  companyRut?: string | null
}

export interface QuoteSchedule {
  date: string | null
  time: string | null
}

export interface QuoteAddresses {
  origin?: string
  destination?: string
}

export interface EnsureBookingInput {
  quoteId: string
  client: QuoteClient
  schedule: QuoteSchedule
  addresses: QuoteAddresses
  estimatedPrice: number
  paymentType: PaymentType
  photoUrls?: string[]
}

/** Error tipado para que las rutas devuelvan 409 cuando el horario ya no tiene cupo. */
export class SlotUnavailableError extends Error {
  constructor() {
    super('Este horario ya no está disponible')
    this.name = 'SlotUnavailableError'
  }
}

/** Montos derivados del precio estimado mostrado al cliente. */
export function computeQuoteAmounts(estimatedPrice: number) {
  return {
    estimated: Math.round(estimatedPrice),
    abono50: Math.round(estimatedPrice * 0.5),
    full95: Math.round(estimatedPrice * 0.95), // 100% con 5% de descuento
  }
}

/**
 * Garantiza que exista UNA pre-reserva (booking) para este quoteId.
 * - Idempotente: si ya existe un booking con ese quote_id, lo reutiliza (no duplica).
 * - La crea como provisional (is_provisional=TRUE) => no consume cupo hasta que se paga.
 * - Verifica cupo contra bookings CONFIRMADOS/pendientes reales (no provisionales).
 */
export async function ensureProvisionalBooking(
  input: EnsureBookingInput
): Promise<{ quoteId: string; bookingRowId: string; existed: boolean }> {
  const { quoteId, client, schedule, addresses, estimatedPrice, paymentType, photoUrls } = input

  if (!quoteId || !client?.name || !client?.email || !client?.phone) {
    throw new Error('Datos de cliente incompletos para crear la reserva')
  }
  if (!schedule?.date || !schedule?.time) {
    throw new Error('Fecha u hora de la mudanza faltante')
  }

  // Idempotencia: ¿ya existe el booking para este quoteId?
  const { data: existing, error: findError } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('quote_id', quoteId)
    .maybeSingle()

  if (findError) {
    console.error('[quoteCheckout] Error buscando booking existente:', findError)
  }
  if (existing) {
    return { quoteId, bookingRowId: existing.id, existed: true }
  }

  // Verificar cupo real del horario (solo bookings no provisionales cuentan)
  const { data: configData, error: configError } = await supabaseAdmin
    .from('fleet_config')
    .select('num_vehicles')
    .single()

  if (configError || !configData) {
    throw new Error('Error obteniendo configuración de flota')
  }

  const { count: bookingCount } = await supabaseAdmin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('scheduled_date', schedule.date)
    .eq('scheduled_time', schedule.time)
    .eq('is_provisional', false)
    .in('status', ['confirmed', 'pending'])

  const { data: blockedData } = await supabaseAdmin
    .from('blocked_slots')
    .select('id')
    .eq('date', schedule.date)
    .lte('start_time', schedule.time)
    .gt('end_time', schedule.time)

  const availableSlots = configData.num_vehicles - (bookingCount || 0)
  const isBlocked = Boolean(blockedData && blockedData.length > 0)

  if (availableSlots <= 0 || isBlocked) {
    throw new SlotUnavailableError()
  }

  const isCompany = client.isCompany || false

  const { data: booking, error: createError } = await supabaseAdmin
    .from('bookings')
    .insert({
      quote_id: quoteId,
      client_name: client.name,
      client_email: client.email,
      client_phone: client.phone,
      scheduled_date: schedule.date,
      scheduled_time: schedule.time,
      duration_hours: 4,
      status: 'pending',
      payment_status: 'pending',
      payment_type: paymentType,
      is_provisional: true, // no consume cupo hasta que Flow confirme el pago
      total_price: Math.round(estimatedPrice),
      original_price: Math.round(estimatedPrice),
      origin_address: addresses?.origin || null,
      destination_address: addresses?.destination || null,
      is_company: isCompany,
      company_name: isCompany ? client.companyName || null : null,
      company_rut: isCompany ? client.companyRut || null : null,
      photo_urls: Array.isArray(photoUrls) && photoUrls.length > 0 ? photoUrls : [],
    })
    .select('id')
    .single()

  if (createError || !booking) {
    console.error('[quoteCheckout] Error creando pre-reserva:', createError)
    throw new Error('Error al crear la reserva')
  }

  return { quoteId, bookingRowId: booking.id, existed: false }
}

/**
 * Crea una orden de pago en Flow para este quoteId.
 * - commerceOrder único por intento (evita conflictos de duplicado en Flow).
 * - optional.bookingId = quoteId (estable) => el webhook resuelve SIEMPRE el mismo booking,
 *   sin importar cuántas órdenes (50% del correo, 50% en página, 100%) se hayan generado.
 */
export async function createQuoteFlowOrder(params: {
  quoteId: string
  paymentType: PaymentType
  amount: number
  email: string
  subject: string
}): Promise<FlowPaymentResponse> {
  const { quoteId, paymentType, amount, email, subject } = params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return flowService.createPayment({
    commerceOrder: `${quoteId}-${paymentType}-${Date.now()}`,
    subject,
    currency: 'CLP',
    amount,
    email,
    urlConfirmation: `${appUrl}/api/payment/confirm`,
    urlReturn: `${appUrl}/api/payment/result`,
    optional: JSON.stringify({ bookingId: quoteId, paymentType }),
  })
}

import type { AdminQuoteData } from './adminQuotePdf'

export type AdminPdfItem = {
  name: string
  quantity: number
  volume: number
}

export interface BookingQuoteDetails {
  quote_id?: string | null
  email?: string | null
  source?: string | null
  status?: string | null
  scheduled_date?: string | null
  scheduled_time?: string | null
  converted_booking_id?: string | null
  is_flexible?: boolean | null
  recommended_vehicle?: string | null
  total_volume?: number | string | null
  total_weight?: number | string | null
  total_distance?: number | string | null
  items_summary?: unknown
  additional_services?: unknown
}

export interface AdminBookingQuoteSource {
  id?: string | null
  quote_id?: string | null
  client_name: string
  client_email?: string | null
  client_phone?: string | null
  /** Origen de marketing del prospecto del que proviene esta reserva (si aplica). */
  source?: string | null
  /** true si la reserva se enriqueció con un prospecto coincidente. */
  from_prospect?: boolean
  is_company?: boolean | null
  company_name?: string | null
  company_rut?: string | null
  origin_address?: string | null
  destination_address?: string | null
  visit_address?: string | null
  scheduled_date?: string | null
  scheduled_time?: string | null
  total_price?: number | string | null
  is_flexible?: boolean | null
  recommended_vehicle?: string | null
  total_volume?: number | string | null
  total_weight?: number | string | null
  total_distance?: number | string | null
  items_summary?: unknown
  additional_services?: unknown
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function normalizeDate(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 10) : ''
}

function normalizeTime(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 5) : ''
}

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function scheduleKey(email: unknown, date: unknown, time: unknown): string {
  const normalizedEmail = normalizeEmail(email)
  const normalizedDate = normalizeDate(date)
  const normalizedTime = normalizeTime(time)
  return normalizedEmail && normalizedDate && normalizedTime
    ? `${normalizedEmail}|${normalizedDate}|${normalizedTime}`
    : ''
}

function normalizeAdditionalServices(value: unknown): Record<string, any> | undefined {
  const parsed = parseJsonValue(value)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined
  return parsed as Record<string, any>
}

export function normalizeAdminPdfItems(
  value: unknown,
  totalVolume?: number | string | null
): AdminPdfItem[] {
  const parsed = parseJsonValue(value)
  if (!Array.isArray(parsed)) return []

  const items = parsed
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const name = normalizeText(record.name)
      const quantity = toNumber(record.quantity) || 0
      const volume = toNumber(record.volume) || 0
      if (!name || quantity <= 0 || volume < 0) return null
      return { name, quantity, volume }
    })
    .filter((item): item is AdminPdfItem => Boolean(item))

  if (items.length === 0) return []

  const expectedTotal = toNumber(totalVolume)
  const rawSum = items.reduce((sum, item) => sum + item.volume, 0)
  const renderedRawSum = items.reduce((sum, item) => sum + item.volume * item.quantity, 0)
  const hasExpectedTotal = typeof expectedTotal === 'number' && expectedTotal > 0
  const epsilon = 0.05

  const rawLooksLikeLineTotals =
    !hasExpectedTotal ||
    Math.abs(rawSum - expectedTotal) <= epsilon ||
    Math.abs(renderedRawSum - expectedTotal) > epsilon

  return items.map((item) => ({
    ...item,
    volume: rawLooksLikeLineTotals ? item.volume / item.quantity : item.volume,
  }))
}

function pickQuoteDetails(prospect?: BookingQuoteDetails): Partial<AdminBookingQuoteSource> {
  if (!prospect) return {}

  const details: Partial<AdminBookingQuoteSource> = {}
  if (prospect.is_flexible !== undefined && prospect.is_flexible !== null) {
    details.is_flexible = prospect.is_flexible
  }
  if (prospect.recommended_vehicle) details.recommended_vehicle = prospect.recommended_vehicle
  if (prospect.total_volume !== undefined && prospect.total_volume !== null) details.total_volume = prospect.total_volume
  if (prospect.total_weight !== undefined && prospect.total_weight !== null) details.total_weight = prospect.total_weight
  if (prospect.total_distance !== undefined && prospect.total_distance !== null) details.total_distance = prospect.total_distance
  if (prospect.items_summary !== undefined && prospect.items_summary !== null) details.items_summary = prospect.items_summary
  if (prospect.additional_services !== undefined && prospect.additional_services !== null) {
    details.additional_services = prospect.additional_services
  }
  if (prospect.source) details.source = prospect.source
  // Solo se invoca cuando hubo match con un prospecto => marca el origen de la reserva.
  details.from_prospect = true
  return details
}

export function mergeBookingQuoteDetails<T extends AdminBookingQuoteSource>(
  bookings: T[],
  prospects: BookingQuoteDetails[]
): Array<T & Partial<BookingQuoteDetails>> {
  const byBookingId = new Map<string, BookingQuoteDetails>()
  const byQuoteId = new Map<string, BookingQuoteDetails>()
  const bySchedule = new Map<string, BookingQuoteDetails>()

  prospects.forEach((prospect) => {
    const convertedBookingId = normalizeText(prospect.converted_booking_id)
    if (convertedBookingId && !byBookingId.has(convertedBookingId)) {
      byBookingId.set(convertedBookingId, prospect)
    }

    const quoteId = normalizeText(prospect.quote_id)
    if (quoteId && !byQuoteId.has(quoteId)) {
      byQuoteId.set(quoteId, prospect)
    }

    const key = scheduleKey(prospect.email, prospect.scheduled_date, prospect.scheduled_time)
    if (key && !bySchedule.has(key)) {
      bySchedule.set(key, prospect)
    }
  })

  return bookings.map((booking) => {
    const prospect =
      (booking.id ? byBookingId.get(booking.id) : undefined) ||
      (booking.quote_id ? byQuoteId.get(booking.quote_id) : undefined) ||
      bySchedule.get(scheduleKey(booking.client_email, booking.scheduled_date, booking.scheduled_time))

    if (!prospect) return booking
    return {
      ...booking,
      ...pickQuoteDetails(prospect),
    }
  })
}

export function bookingToAdminQuoteData(booking: AdminBookingQuoteSource): AdminQuoteData {
  return {
    name: booking.client_name,
    email: booking.client_email,
    phone: booking.client_phone,
    isCompany: booking.is_company || false,
    companyName: booking.company_name,
    companyRut: booking.company_rut,
    originAddress: booking.origin_address || booking.visit_address,
    destinationAddress: booking.destination_address,
    scheduledDate: booking.scheduled_date,
    scheduledTime: booking.scheduled_time,
    totalPrice: toNumber(booking.total_price),
    isFlexible: booking.is_flexible || false,
    recommendedVehicle: booking.recommended_vehicle,
    totalVolume: toNumber(booking.total_volume),
    totalWeight: toNumber(booking.total_weight),
    totalDistance: toNumber(booking.total_distance),
    items: normalizeAdminPdfItems(booking.items_summary, booking.total_volume),
    additionalServices: normalizeAdditionalServices(booking.additional_services),
  }
}

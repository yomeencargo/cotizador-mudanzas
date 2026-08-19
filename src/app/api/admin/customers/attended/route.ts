import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { aggregateAttendedCustomers, type AttendedCustomer } from '@/lib/adminAnalytics'
import { mergeBookingQuoteDetails } from '@/lib/adminBookingQuoteData'
import { normalizeOrigin } from '@/lib/prospectSource'

interface CustomerRow extends AttendedCustomer {
  isFrequent?: boolean
  notes?: string
}

// Cartera unificada: clientes atendidos derivados de reservas + fichas creadas
// manualmente sin reserva. La identidad se consolida por email.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [bookingsResult, prospectsResult] = await Promise.all([
      supabaseAdmin
        .from('bookings')
        .select(
          'id, quote_id, client_email, client_name, client_phone, is_company, company_name, company_rut, scheduled_date, scheduled_time, status, total_price, original_price, adjusted_price, amount_paid, payment_status, payment_type'
        )
        .neq('status', 'cancelled')
        .or('status.eq.completed,and(payment_status.eq.approved,payment_type.eq.completo)'),
      supabaseAdmin
        .from('quote_prospects')
        .select(
          'id, quote_id, email, name, phone, source, status, is_frequent, is_company, company_name, company_rut, notes, scheduled_date, scheduled_time, converted_booking_id, lead_key, created_at'
        )
        .order('created_at', { ascending: false }),
    ])

    if (bookingsResult.error) {
      console.error('[customers/attended] bookings error:', bookingsResult.error)
      return NextResponse.json(
        { error: 'Error obteniendo clientes atendidos' },
        { status: 500 }
      )
    }
    if (prospectsResult.error) {
      console.error('[customers/attended] prospects error:', prospectsResult.error)
      return NextResponse.json(
        { error: 'Error obteniendo fichas de clientes' },
        { status: 500 }
      )
    }

    const prospects = prospectsResult.data || []
    const enrichedBookings = mergeBookingQuoteDetails(bookingsResult.data || [], prospects)
    const attended = aggregateAttendedCustomers(enrichedBookings) as CustomerRow[]
    const byEmail = new Map(attended.map((customer) => [customer.email, customer]))
    const manualOrigins = new Map(
      prospects
        .filter((prospect) => String(prospect.lead_key || '').startsWith('manual_customer:'))
        .map((prospect) => [
          (prospect.email || '').trim().toLowerCase(),
          normalizeOrigin(prospect.source),
        ])
    )

    // Agrega fichas sin reserva y enriquece las ya atendidas. La clasificación manual
    // tiene precedencia para poder corregir también el histórico del cliente.
    for (const prospect of prospects) {
      const email = (prospect.email || '').trim().toLowerCase()
      if (!email) continue
      const existing = byEmail.get(email)
      const origin = normalizeOrigin(prospect.source)
      const manualOrigin = manualOrigins.get(email)

      if (existing) {
        if (manualOrigin) existing.origin = manualOrigin
        else if (origin === 'cliente_antiguo') existing.origin = origin
        existing.isFrequent = Boolean(existing.isFrequent) || Boolean(prospect.is_frequent)
        existing.notes = existing.notes || prospect.notes || ''
        continue
      }

      // Un prospecto abierto todavía no es una ficha de cliente independiente.
      if (prospect.status !== 'converted') continue

      byEmail.set(email, {
        email,
        name: prospect.name || email,
        phone: prospect.phone || '',
        isCompany: Boolean(prospect.is_company),
        companyName: prospect.company_name || '',
        companyRut: prospect.company_rut || '',
        movesCount: 0,
        firstMoveDate: null,
        lastMoveDate: null,
        totalSpent: 0,
        origin: manualOrigin || origin,
        isFrequent: Boolean(prospect.is_frequent),
        notes: prospect.notes || '',
      })
    }

    const customers = [...byEmail.values()].sort((a, b) => {
      if (b.movesCount !== a.movesCount) return b.movesCount - a.movesCount
      return b.totalSpent - a.totalSpent
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error in /api/admin/customers/attended:', error)
    return NextResponse.json(
      { error: 'Error obteniendo clientes' },
      { status: 500 }
    )
  }
}

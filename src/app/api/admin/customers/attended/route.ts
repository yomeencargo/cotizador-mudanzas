import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buildUnifiedCustomers } from '@/lib/adminAnalytics'
import { mergeBookingQuoteDetails } from '@/lib/adminBookingQuoteData'

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
      return NextResponse.json({ error: 'Error obteniendo clientes atendidos' }, { status: 500 })
    }
    if (prospectsResult.error) {
      console.error('[customers/attended] prospects error:', prospectsResult.error)
      return NextResponse.json({ error: 'Error obteniendo fichas de clientes' }, { status: 500 })
    }

    const prospects = prospectsResult.data || []
    const enrichedBookings = mergeBookingQuoteDetails(bookingsResult.data || [], prospects)
    const customers = buildUnifiedCustomers(enrichedBookings, prospects)

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error in /api/admin/customers/attended:', error)
    return NextResponse.json({ error: 'Error obteniendo clientes' }, { status: 500 })
  }
}

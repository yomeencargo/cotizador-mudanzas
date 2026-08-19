import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  groupBookingsByMonth,
  groupProspectsBySource,
  buildFunnel,
} from '@/lib/adminAnalytics'

// Datos en vivo: no cachear en build.
export const dynamic = 'force-dynamic'

const MONTHS_BACK = 6

export async function GET() {
  try {
    const [bookingsRes, prospectsRes] = await Promise.all([
      supabaseAdmin
        .from('bookings')
        .select('scheduled_date, status, total_price, original_price, adjusted_price, amount_paid'),
      supabaseAdmin.from('quote_prospects').select('source, status, lead_key'),
    ])

    if (bookingsRes.error) {
      console.error('[analytics] bookings error:', bookingsRes.error)
    }
    if (prospectsRes.error) {
      console.error('[analytics] prospects error:', prospectsRes.error)
    }

    const bookings = bookingsRes.data || []
    const prospects = (prospectsRes.data || []).filter((prospect) => {
      const key = String(prospect.lead_key || '')
      return !key.startsWith('manual_customer:') && !key.startsWith('admin_booking:')
    })

    return NextResponse.json({
      monthly: groupBookingsByMonth(bookings, MONTHS_BACK),
      sources: groupProspectsBySource(prospects),
      funnel: buildFunnel(prospects, bookings),
    })
  } catch (error) {
    console.error('Error in /api/admin/analytics:', error)
    return NextResponse.json(
      { error: 'Error obteniendo analítica' },
      { status: 500 }
    )
  }
}

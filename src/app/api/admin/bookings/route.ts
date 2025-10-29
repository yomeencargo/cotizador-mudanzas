import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('[API] Fetching bookings from database...')
    
    // Obtener todas las reservas con paginación
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        quote_id,
        client_name,
        client_email,
        client_phone,
        scheduled_date,
        scheduled_time,
        duration_hours,
        status,
        notes,
        payment_type,
        total_price,
        original_price,
        origin_address,
        destination_address,
        created_at,
        confirmed_at,
        completed_at,
        cancelled_at
      `)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('[API] Error fetching bookings:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { error: 'Error obteniendo reservas', details: error.message },
        { status: 500 }
      )
    }

    console.log(`[API] Successfully fetched ${bookings?.length || 0} bookings`)
    return NextResponse.json(bookings || [])
  } catch (error) {
    console.error('[API] Exception in /api/admin/bookings:', error)
    return NextResponse.json(
      { error: 'Error obteniendo reservas', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

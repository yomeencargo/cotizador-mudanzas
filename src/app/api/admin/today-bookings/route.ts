import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    console.log('[API] Fetching today bookings for date:', today)

    // Obtener reservas de hoy ordenadas por hora
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        client_name,
        client_phone,
        scheduled_time,
        status,
        created_at
      `)
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('[API] Error fetching today bookings:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { error: 'Error obteniendo reservas de hoy', details: error.message },
        { status: 500 }
      )
    }

    console.log(`[API] Successfully fetched ${bookings?.length || 0} today bookings`)

    // Simular precio estimado (en producción deberías tenerlo en la BD)
    const bookingsWithPrice = bookings?.map(booking => ({
      ...booking,
      estimated_price: Math.floor(Math.random() * 30000) + 30000 // $30k - $60k
    })) || []

    return NextResponse.json(bookingsWithPrice)
  } catch (error) {
    console.error('[API] Exception in /api/admin/today-bookings:', error)
    return NextResponse.json(
      { error: 'Error obteniendo reservas de hoy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

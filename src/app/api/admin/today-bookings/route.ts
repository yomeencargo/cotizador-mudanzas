import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

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
      console.error('Error fetching today bookings:', error)
      return NextResponse.json(
        { error: 'Error obteniendo reservas de hoy' },
        { status: 500 }
      )
    }

    // Simular precio estimado (en producción deberías tenerlo en la BD)
    const bookingsWithPrice = bookings?.map(booking => ({
      ...booking,
      estimated_price: Math.floor(Math.random() * 30000) + 30000 // $30k - $60k
    })) || []

    return NextResponse.json(bookingsWithPrice)
  } catch (error) {
    console.error('Error in /api/admin/today-bookings:', error)
    return NextResponse.json(
      { error: 'Error obteniendo reservas de hoy' },
      { status: 500 }
    )
  }
}

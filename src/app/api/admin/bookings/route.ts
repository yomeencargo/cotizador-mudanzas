import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
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
        created_at,
        confirmed_at,
        completed_at,
        cancelled_at
      `)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json(
        { error: 'Error obteniendo reservas' },
        { status: 500 }
      )
    }

    return NextResponse.json(bookings || [])
  } catch (error) {
    console.error('Error in /api/admin/bookings:', error)
    return NextResponse.json(
      { error: 'Error obteniendo reservas' },
      { status: 500 }
    )
  }
}

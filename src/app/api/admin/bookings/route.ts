import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('[API] Fetching bookings from database...')
    
    // Obtener todas las reservas con paginación
    // EXCLUIR reservas canceladas (pagos rechazados)
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
        payment_status,
        total_price,
        original_price,
        origin_address,
        destination_address,
        created_at,
        confirmed_at,
        completed_at,
        cancelled_at
      `)
      .neq('status', 'cancelled') // NO mostrar reservas canceladas (pagos rechazados)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      quote_id,
      client_name,
      client_email,
      client_phone,
      scheduled_date,
      scheduled_time,
      duration_hours = 4,
      status = 'pending',
      payment_type,
      total_price,
      original_price,
      origin_address,
      destination_address,
      notes,
    } = body

    if (!client_name || !client_email || !client_phone || !scheduled_date || !scheduled_time) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // Obtener capacidad de flota
    const { data: configData, error: configError } = await supabaseAdmin
      .from('fleet_config')
      .select('num_vehicles')
      .single()

    if (configError || !configData) {
      return NextResponse.json(
        { error: 'Error obteniendo configuración de flota' },
        { status: 500 }
      )
    }

    const capacity = configData.num_vehicles

    // Contar reservas activas para ese horario
    const { count: bookingCount } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('scheduled_date', scheduled_date)
      .eq('scheduled_time', scheduled_time)
      .in('status', ['confirmed', 'pending'])

    // Verificar bloqueos
    const { data: blockedData } = await supabaseAdmin
      .from('blocked_slots')
      .select('id')
      .eq('date', scheduled_date)
      .lte('start_time', scheduled_time)
      .gt('end_time', scheduled_time)

    const activeBookings = bookingCount || 0
    const availableSlots = (capacity || 0) - activeBookings
    const isBlocked = !!(blockedData && blockedData.length > 0)

    if (availableSlots <= 0 || isBlocked) {
      return NextResponse.json(
        { error: 'Este horario ya no está disponible' },
        { status: 409 }
      )
    }

    // Crear la reserva
    const { data: booking, error: createError } = await supabaseAdmin
      .from('bookings')
      .insert({
        quote_id,
        client_name,
        client_email,
        client_phone,
        scheduled_date,
        scheduled_time,
        duration_hours,
        status,
        payment_type,
        total_price,
        original_price,
        origin_address,
        destination_address,
        notes,
      })
      .select()
      .single()

    if (createError) {
      console.error('[API] Error creating booking:', createError)
      return NextResponse.json(
        { error: 'Error al crear la reserva' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        booking,
        message: 'Reserva creada exitosamente',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] Exception in /api/admin/bookings POST:', error)
    return NextResponse.json(
      { error: 'Error al crear la reserva' },
      { status: 500 }
    )
  }
}

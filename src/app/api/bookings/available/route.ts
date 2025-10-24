import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Fecha requerida' },
        { status: 400 }
      )
    }

    // 1. Obtener capacidad de vehículos
    const { data: configData, error: configError } = await supabaseAdmin
      .from('fleet_config')
      .select('num_vehicles')
      .single()

    if (configError) {
      console.error('Error fetching fleet config:', configError)
      return NextResponse.json(
        { error: 'Error obteniendo configuración de flota' },
        { status: 500 }
      )
    }

    if (!configData) {
      return NextResponse.json(
        { error: 'Configuración de flota no encontrada' },
        { status: 404 }
      )
    }

    const capacity = configData.num_vehicles

    // 2. Horarios disponibles
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00']

    // 3. Para cada horario, contar reservas y bloques
    const availability = await Promise.all(
      timeSlots.map(async (time) => {
        // Contar mudanzas confirmadas y pendientes
        const { count: bookingCount, error: bookingError } = await supabaseAdmin
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('scheduled_date', date)
          .eq('scheduled_time', time)
          .in('status', ['confirmed', 'pending'])

        // Verificar si está bloqueado
        const { data: blockedData, error: blockedError } = await supabaseAdmin
          .from('blocked_slots')
          .select('id')
          .eq('date', date)
          .lte('start_time', time)
          .gt('end_time', time)

        const isBlocked = blockedData && blockedData.length > 0
        const activeBookings = bookingCount || 0
        const availableSlots = capacity - activeBookings
        const isAvailable = availableSlots > 0 && !isBlocked

        return {
          time,
          availableSlots: Math.max(0, availableSlots),
          capacity,
          booked: activeBookings,
          isBlocked,
          isAvailable,
          occupancy: `${activeBookings}/${capacity}`,
        }
      })
    )

    // Filtrar solo los disponibles (no mostrar llenos)
    const availableOnly = availability.filter(slot => slot.isAvailable)

    return NextResponse.json(availableOnly)
  } catch (error) {
    console.error('Error in /api/bookings/available:', error)
    return NextResponse.json(
      { error: 'Error obteniendo disponibilidad' },
      { status: 500 }
    )
  }
}

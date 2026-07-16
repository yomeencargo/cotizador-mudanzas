import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getActiveCapacity } from '@/lib/fleetCapacity'

// Lee datos en vivo: no debe prerenderizarse/cachearse en build.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('[API] Fetching admin stats...')
    
    // Obtener estadísticas del dashboard
    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

    // 1. Reservas de hoy
    const { count: todayBookings, error: todayError } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('scheduled_date', today)
      .in('status', ['confirmed', 'pending'])

    if (todayError) {
      console.error('[API] Error fetching today bookings:', todayError)
    }

    // 2. Reservas pendientes
    const { count: pendingBookings, error: pendingError } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (pendingError) {
      console.error('[API] Error fetching pending bookings:', pendingError)
    }

    // 3. Configuración de flota
    const { data: fleetConfig, error: fleetError } = await supabaseAdmin
      .from('fleet_config')
      .select('*')
      .single()

    if (fleetError) {
      console.error('[API] Error fetching fleet config:', fleetError)
    }

    // 4. Ingresos del mes (usar precios reales de las reservas - TODAS excepto canceladas)
    const { data: monthlyBookings, error: monthlyError } = await supabaseAdmin
      .from('bookings')
      .select('id, original_price, total_price')
      .gte('scheduled_date', startOfMonth)
      .lte('scheduled_date', endOfMonth)
      .neq('status', 'cancelled')

    if (monthlyError) {
      console.error('[API] Error fetching monthly bookings:', monthlyError)
    }

    // Calcular ingresos reales sumando los precios (priorizar total_price si existe, sino original_price)
    const monthlyRevenue = monthlyBookings?.reduce((sum, booking) => {
      const price = booking.total_price || booking.original_price || 0
      return sum + (typeof price === 'number' ? price : 0)
    }, 0) || 0

    // 5. Ocupación del mes = reservas del mes / cupos reales.
    //    Cupos = vehículos ACTIVOS * franjas horarias configuradas * días del mes
    //    (antes era un 6*30 hardcodeado que ignoraba flota y horarios reales).
    const { data: scheduleConfig } = await supabaseAdmin
      .from('schedule_config')
      .select('time_slots')
      .single()

    const slotsPerDay = Array.isArray(scheduleConfig?.time_slots)
      ? scheduleConfig!.time_slots.length
      : 6
    const activeVehicles = getActiveCapacity(fleetConfig)
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

    const totalSlots = Math.max(1, activeVehicles * slotsPerDay * daysInMonth)
    const occupiedSlots = monthlyBookings?.length || 0
    const occupancyRate = Math.min(100, Math.round((occupiedSlots / totalSlots) * 100))

    // 6. Ticket promedio
    const averageTicket = occupiedSlots > 0 ? Math.round(monthlyRevenue / occupiedSlots) : 0

    const stats = {
      todayBookings: todayBookings || 0,
      monthlyRevenue,
      pendingBookings: pendingBookings || 0,
      totalVehicles: fleetConfig?.num_vehicles,
      occupancyRate,
      averageTicket,
    }

    console.log('[API] Stats fetched successfully:', stats)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[API] Exception in /api/admin/stats:', error)
    return NextResponse.json(
      { error: 'Error obteniendo estadísticas', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

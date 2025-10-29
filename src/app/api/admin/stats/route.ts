import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
      .select('num_vehicles')
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

    // 5. Calcular ocupación promedio (simulado)
    const totalSlots = 6 * 30 // 6 horarios por día * 30 días
    const occupiedSlots = monthlyBookings?.length || 0
    const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0

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

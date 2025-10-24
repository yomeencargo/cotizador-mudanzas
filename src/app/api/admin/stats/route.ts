import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Obtener estadísticas del dashboard
    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

    // 1. Reservas de hoy
    const { count: todayBookings } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('scheduled_date', today)
      .in('status', ['confirmed', 'pending'])

    // 2. Reservas pendientes
    const { count: pendingBookings } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    // 3. Configuración de flota
    const { data: fleetConfig } = await supabaseAdmin
      .from('fleet_config')
      .select('num_vehicles')
      .single()

    // 4. Ingresos del mes (simulado - necesitarías agregar campo de precio a bookings)
    const { data: monthlyBookings } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .gte('scheduled_date', startOfMonth)
      .lte('scheduled_date', endOfMonth)
      .eq('status', 'confirmed')

    // Simular ingresos (en producción deberías tener el precio real)
    const monthlyRevenue = (monthlyBookings?.length || 0) * 45000 // Precio promedio estimado

    // 5. Calcular ocupación promedio (simulado)
    const totalSlots = 6 * 30 // 6 horarios por día * 30 días
    const occupiedSlots = monthlyBookings?.length || 0
    const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0

    // 6. Ticket promedio
    const averageTicket = monthlyBookings?.length ? Math.round(monthlyRevenue / monthlyBookings.length) : 0

    const stats = {
      todayBookings: todayBookings || 0,
      monthlyRevenue,
      pendingBookings: pendingBookings || 0,
      totalVehicles: fleetConfig?.num_vehicles,
      occupancyRate,
      averageTicket,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Error obteniendo estadísticas' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getActiveCapacity } from '@/lib/fleetCapacity'
import {
  summarizeBookings,
  summarizeBookingsByOrigin,
  summarizeOutstandingQuotes,
} from '@/lib/revenueBreakdown'
import { mergeBookingQuoteDetails } from '@/lib/adminBookingQuoteData'

// Lee datos en vivo: no debe prerenderizarse/cachearse en build.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('[API] Fetching admin stats...')
    
    // Obtener estadísticas del dashboard
    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

    const todayChile = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
    }).format(new Date())

    // Las siete lecturas no dependen una de otra: van en paralelo. Una detrás de otra
    // sumaban ~0,9 s de pura espera de red (medido el 24-sep-2026) para un resumen de 1 KB.
    const [
      { count: todayBookings, error: todayError },
      { count: pendingBookings, error: pendingError },
      { data: fleetConfig, error: fleetError },
      // 4. Ingresos del mes, separados en COBRADO y POR COBRAR.
      //    Ojo: no se suma total_price directamente porque cambió de significado en
      //    julio-2026 (ver comentario en revenueBreakdown.ts). `amount_paid` manda; la
      //    modalidad de pago queda como respaldo para registros históricos.
      { data: monthlyBookings, error: monthlyError },
      { data: originProspects, error: originError },
      // 4b. Cotizaciones vigentes sin reserva: la mudanza todavía no ocurrió y el lead
      //     sigue abierto. Es plata que aún se puede cerrar.
      { data: openProspects },
      // 5. Franjas horarias configuradas, para la ocupación del mes.
      { data: scheduleConfig },
    ] = await Promise.all([
      // 1. Reservas de hoy
      supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('scheduled_date', today)
        .in('status', ['confirmed', 'pending']),
      // 2. Reservas pendientes
      supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      // 3. Configuración de flota
      supabaseAdmin.from('fleet_config').select('*').single(),
      supabaseAdmin
        .from('bookings')
        .select(
          'id, quote_id, client_name, client_email, client_phone, scheduled_date, scheduled_time, original_price, total_price, adjusted_price, amount_paid, payment_type, payment_status, status, is_provisional, flow_token, payment_method'
        )
        .gte('scheduled_date', startOfMonth)
        .lte('scheduled_date', endOfMonth)
        .neq('status', 'cancelled'),
      supabaseAdmin
        .from('quote_prospects')
        .select(
          'quote_id, email, source, scheduled_date, scheduled_time, converted_booking_id, lead_key, created_at'
        )
        .eq('status', 'converted'),
      supabaseAdmin
        .from('quote_prospects')
        .select('status, total_price, adjusted_price, scheduled_date, converted_booking_id')
        .gte('scheduled_date', todayChile),
      supabaseAdmin.from('schedule_config').select('time_slots').single(),
    ])

    if (todayError) console.error('[API] Error fetching today bookings:', todayError)
    if (pendingError) console.error('[API] Error fetching pending bookings:', pendingError)
    if (fleetError) console.error('[API] Error fetching fleet config:', fleetError)
    if (monthlyError) console.error('[API] Error fetching monthly bookings:', monthlyError)
    if (originError) console.error('[API] Error fetching customer origins:', originError)

    const monthlyWithOrigin = mergeBookingQuoteDetails(
      monthlyBookings || [],
      originProspects || []
    )
    const revenue = summarizeBookings(monthlyWithOrigin)
    const revenueByOrigin = summarizeBookingsByOrigin(monthlyWithOrigin)
    // Se mantiene `monthlyRevenue` por compatibilidad: ahora es la plata realmente
    // recibida, no el valor nominal de las reservas.
    const monthlyRevenue = revenue.paid

    const quotes = summarizeOutstandingQuotes(openProspects || [], todayChile)

    // 5. Ocupación del mes = reservas del mes / cupos reales.
    //    Cupos = vehículos ACTIVOS * franjas horarias configuradas * días del mes
    //    (antes era un 6*30 hardcodeado que ignoraba flota y horarios reales).
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
    // Ticket promedio sobre el valor de lo reservado (no sobre lo ya cobrado).
    const averageTicket = occupiedSlots > 0 ? Math.round(revenue.booked / occupiedSlots) : 0

    const stats = {
      todayBookings: todayBookings || 0,
      monthlyRevenue,
      pendingBookings: pendingBookings || 0,
      totalVehicles: fleetConfig?.num_vehicles,
      occupancyRate,
      averageTicket,
      // Desglose de ingresos del mes
      revenue: {
        paid: revenue.paid,
        paidCount: revenue.paidCount,
        paidByChannel: revenue.paidByChannel,
        pending: revenue.pending,
        pendingCount: revenue.pendingCount,
        booked: revenue.booked,
        byOrigin: revenueByOrigin,
      },
      outstandingQuotes: {
        total: quotes.total,
        count: quotes.count,
      },
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

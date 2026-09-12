import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  bookingVolumeM3,
  mergeBookingQuoteDetails,
  normalizeAdminPdfItems,
} from '@/lib/adminBookingQuoteData'
import { pendingAmount } from '@/lib/revenueBreakdown'
import {
  ensureVehicleAssignments,
  getFleetVehicleViews,
  getVehicleAssignmentsInRange,
} from '@/lib/vehicleAssignment'

// Lee datos en vivo: no debe prerenderizarse/cachearse en build.
export const dynamic = 'force-dynamic'

// "Hoy" en hora de Chile: el server (Vercel) corre en UTC, así que un new Date() naive
// puede caer en el día siguiente durante la noche chilena y desalinear todo el rango.
function chileTodayString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date())
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Devuelve las reservas REALES (pagadas/confirmadas, no provisionales, no canceladas) de
// hoy hasta 6 días adelante, para los widgets "Hoy" / "Mañana" / "Esta semana" del dashboard.
export async function GET() {
  try {
    const today = chileTodayString()
    const weekEnd = addDays(today, 6)
    console.log(`[API] Fetching bookings from ${today} to ${weekEnd}`)

    // OJO: total_volume NO es columna de bookings. Vive en la cotización y llega por
    // mergeBookingQuoteDetails más abajo. Pedirla en este select devuelve 42703
    // (undefined_column) y deja el dashboard sin reservas. Verificado el 12-sep-2026.
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        quote_id,
        client_name,
        client_phone,
        scheduled_date,
        scheduled_time,
        status,
        total_price,
        original_price,
        adjusted_price,
        amount_paid,
        payment_status,
        payment_type,
        duration_hours,
        client_email,
        booking_type,
        is_provisional
      `)
      .gte('scheduled_date', today)
      .lte('scheduled_date', weekEnd)
      .eq('is_provisional', false)
      .not('status', 'in', '(cancelled,no_show)')
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('[API] Error fetching upcoming bookings:', {
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

    console.log(`[API] Successfully fetched ${bookings?.length || 0} upcoming bookings`)

    // Camión de cada trabajo: se resuelve acá (nombre + color ya listos) para que el
    // dashboard no tenga que ir a buscar la flota por su cuenta.
    const vehicles = await getFleetVehicleViews()
    const assignments = await ensureVehicleAssignments(
      bookings || [],
      vehicles,
      await getVehicleAssignmentsInRange(today, weekEnd)
    )

    // El volumen y el embalaje viven en la cotización (`quote_prospects.items_summary`),
    // no en la reserva. Se traen acá para que el dashboard los muestre sin obligar a
    // saltar a Reservas, que es justo lo que se pidió evitar.
    const quoteIds = Array.from(
      new Set((bookings || []).map((b) => b.quote_id).filter((q): q is string => Boolean(q)))
    )
    let prospects: any[] = []
    if (quoteIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('quote_prospects')
        .select('quote_id, email, source, items_summary, additional_services, total_volume')
        .in('quote_id', quoteIds)
      prospects = data || []
    }
    const enriquecidas = mergeBookingQuoteDetails(bookings || [], prospects) as any[]

    const result = enriquecidas.map((booking: any) => {
      const vehicle = vehicles.find((v) => v.id === assignments.get(booking.id))
      const items = normalizeAdminPdfItems(booking.items_summary, booking.total_volume)

      // Embalaje: cuántos bultos por tipo, ya contado, para que la fila sea una línea
      // y no una tabla.
      const porTipo = new Map<string, number>()
      for (const it of items || []) {
        const tipo = (it as any)?.packaging?.type
        if (!tipo || tipo === 'none') continue
        porTipo.set(tipo, (porTipo.get(tipo) || 0) + (Number(it.quantity) || 1))
      }
      const embalaje = [...porTipo.entries()].map(([tipo, n]) => `${n}x ${tipo}`).join(', ')

      return {
        ...booking,
        estimated_price:
          booking.adjusted_price ?? booking.original_price ?? booking.total_price ?? null,
        volume_m3: bookingVolumeM3(booking) ?? null,
        packaging_summary: embalaje || null,
        // Saldo con la MISMA función que las tarjetas y el gráfico: quien pagó completo
        // no debe el 5% de descuento.
        pending_amount: pendingAmount(booking),
        vehicle: vehicle
          ? { id: vehicle.id, name: vehicle.name, driver: vehicle.driver, color: vehicle.color }
          : null,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Exception in /api/admin/today-bookings:', error)
    return NextResponse.json(
      { error: 'Error obteniendo reservas', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

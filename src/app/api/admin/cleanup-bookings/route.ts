import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Endpoint para limpiar reservas con pagos pendientes
export async function POST() {
  try {
    console.log('[CLEANUP] Iniciando limpieza de reservas...')

    // OPCIÓN 1: Eliminar TODAS las reservas con status pending (sin importar la antigüedad)
    // Para limpiar las reservas que se crearon durante las pruebas
    const { data: pendingBookings, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, quote_id, created_at, status, payment_status')
      .eq('status', 'pending')

    if (fetchError) {
      console.error('[CLEANUP] Error fetching bookings:', fetchError)
      return NextResponse.json({ error: 'Error al buscar reservas' }, { status: 500 })
    }

    console.log(`[CLEANUP] Encontradas ${pendingBookings?.length || 0} reservas pendientes`)

    let deletedCount = 0

    if (pendingBookings && pendingBookings.length > 0) {
      // Eliminar estas reservas
      const idsToDelete = pendingBookings.map(b => b.id)
      
      const { error: deleteError } = await supabaseAdmin
        .from('bookings')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) {
        console.error('[CLEANUP] Error deleting bookings:', deleteError)
        return NextResponse.json({ error: 'Error al eliminar reservas' }, { status: 500 })
      }

      deletedCount = pendingBookings.length
      console.log(`[CLEANUP] ${deletedCount} reservas pendientes eliminadas`)
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Limpieza completada. ${deletedCount} reservas eliminadas.`
    })
  } catch (error) {
    console.error('[CLEANUP] Exception:', error)
    return NextResponse.json(
      { error: 'Error en limpieza', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

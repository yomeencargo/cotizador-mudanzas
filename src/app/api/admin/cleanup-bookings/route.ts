import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Edad mínima (en horas) de una pre-reserva provisional para considerarla abandonada.
const PROVISIONAL_MAX_AGE_HOURS = 24

// Limpia SOLO pre-reservas provisionales abandonadas: nunca pagadas y con más de 24h.
// Nunca toca reservas con pago aprobado ni reservas confirmadas/reales.
export async function POST() {
  try {
    console.log('[CLEANUP] Iniciando limpieza de pre-reservas provisionales abandonadas...')

    const cutoff = new Date(
      Date.now() - PROVISIONAL_MAX_AGE_HOURS * 60 * 60 * 1000
    ).toISOString()

    // Candidatas: provisionales, sin pago aprobado, antiguas.
    const { data: stale, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, quote_id, created_at, status, payment_status, is_provisional')
      .eq('is_provisional', true)
      .eq('payment_status', 'pending')
      .eq('status', 'pending')
      .lt('created_at', cutoff)

    if (fetchError) {
      console.error('[CLEANUP] Error fetching bookings:', fetchError)
      return NextResponse.json({ error: 'Error al buscar reservas' }, { status: 500 })
    }

    console.log(`[CLEANUP] ${stale?.length || 0} pre-reservas provisionales abandonadas (> ${PROVISIONAL_MAX_AGE_HOURS}h)`)

    let deletedCount = 0

    if (stale && stale.length > 0) {
      const idsToDelete = stale.map((b) => b.id)

      // Guarda de seguridad: jamás eliminar algo con pago aprobado.
      const { error: deleteError } = await supabaseAdmin
        .from('bookings')
        .delete()
        .in('id', idsToDelete)
        .eq('is_provisional', true)
        .neq('payment_status', 'approved')

      if (deleteError) {
        console.error('[CLEANUP] Error deleting bookings:', deleteError)
        return NextResponse.json({ error: 'Error al eliminar reservas' }, { status: 500 })
      }

      deletedCount = stale.length
      console.log(`[CLEANUP] ${deletedCount} pre-reservas provisionales eliminadas`)
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Limpieza completada. ${deletedCount} pre-reservas provisionales abandonadas eliminadas.`,
    })
  } catch (error) {
    console.error('[CLEANUP] Exception:', error)
    return NextResponse.json(
      { error: 'Error en limpieza', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Edad mínima (en horas) de una pre-reserva provisional para considerarla abandonada.
const PROVISIONAL_MAX_AGE_HOURS = 24

// Limpia SOLO pre-reservas provisionales abandonadas: nunca pagadas y con más de 24h.
// Nunca toca reservas con pago aprobado ni reservas confirmadas/reales.
async function runCleanup(): Promise<number> {
  const cutoff = new Date(
    Date.now() - PROVISIONAL_MAX_AGE_HOURS * 60 * 60 * 1000
  ).toISOString()

  const { data: stale, error: fetchError } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('is_provisional', true)
    .eq('payment_status', 'pending')
    .eq('status', 'pending')
    .lt('created_at', cutoff)

  if (fetchError) {
    throw new Error(`Error al buscar reservas: ${fetchError.message}`)
  }

  if (!stale || stale.length === 0) return 0

  const idsToDelete = stale.map((b) => b.id)

  // Guarda de seguridad: jamás eliminar algo con pago aprobado.
  const { error: deleteError } = await supabaseAdmin
    .from('bookings')
    .delete()
    .in('id', idsToDelete)
    .eq('is_provisional', true)
    .neq('payment_status', 'approved')

  if (deleteError) {
    throw new Error(`Error al eliminar reservas: ${deleteError.message}`)
  }

  console.log(`[CLEANUP] ${stale.length} pre-reservas provisionales abandonadas eliminadas`)
  return stale.length
}

// Disparo manual desde el admin.
export async function POST() {
  try {
    const deletedCount = await runCleanup()
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

// Disparo automático por Vercel Cron (GET). Si CRON_SECRET está configurado, se exige
// el header Authorization: Bearer <CRON_SECRET> (Vercel lo envía automáticamente).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  try {
    const deletedCount = await runCleanup()
    return NextResponse.json({ success: true, deletedCount })
  } catch (error) {
    console.error('[CLEANUP] Exception:', error)
    return NextResponse.json(
      { error: 'Error en limpieza', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

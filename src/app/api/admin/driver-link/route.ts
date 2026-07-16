import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomBytes } from 'crypto'

// Gestión del token del link público de choferes. Protegido por el middleware
// de admin (está bajo /api/admin). Solo el admin puede leer/regenerar el token.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('fleet_config')
      .select('*')
      .single()

    if (error) {
      console.error('[driver-link] GET error:', error)
      return NextResponse.json({ error: 'Error obteniendo el link' }, { status: 500 })
    }

    const token =
      (data as { driver_access_token?: string | null } | null)?.driver_access_token || null
    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error in /api/admin/driver-link GET:', error)
    return NextResponse.json({ error: 'Error obteniendo el link' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const token = randomBytes(24).toString('base64url')

    const { data: existing } = await supabaseAdmin
      .from('fleet_config')
      .select('id')
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'No se encontró configuración de flota' },
        { status: 404 }
      )
    }

    const { error } = await supabaseAdmin
      .from('fleet_config')
      .update({ driver_access_token: token, updated_at: new Date().toISOString() })
      .eq('id', existing.id)

    if (error) {
      console.error('[driver-link] POST error:', error)
      return NextResponse.json(
        {
          error:
            'No se pudo generar el link. ¿Está aplicada la migración add_driver_access_token.sql?',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error in /api/admin/driver-link POST:', error)
    return NextResponse.json({ error: 'Error generando el link' }, { status: 500 })
  }
}

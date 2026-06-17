import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Los convertidos viven en "Reservas" (trabajo por hacer); aquí solo leads por convertir.
    const { data: prospects, error } = await supabaseAdmin
      .from('quote_prospects')
      .select('*')
      .neq('status', 'converted')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Admin Prospects] Error fetching:', error)
      return NextResponse.json(
        { error: 'Error obteniendo prospectos', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(prospects || [])
  } catch (error) {
    console.error('[Admin Prospects] Exception:', error)
    return NextResponse.json(
      { error: 'Error obteniendo prospectos' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes, source, adjusted_price, adjustment_comment, scheduled_date, scheduled_time } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID del prospecto requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (status !== undefined) updateData.status = status
    if (source !== undefined) updateData.source = source
    if (notes !== undefined) updateData.notes = notes
    if (adjusted_price !== undefined) {
      updateData.adjusted_price =
        adjusted_price === null || adjusted_price === '' ? null : Math.round(Number(adjusted_price))
    }
    if (adjustment_comment !== undefined) updateData.adjustment_comment = adjustment_comment || null
    if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date || null
    if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time || null

    const { data, error } = await supabaseAdmin
      .from('quote_prospects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Admin Prospects] Error updating:', error)
      return NextResponse.json(
        { error: 'Error al actualizar prospecto' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, prospect: data })
  } catch (error) {
    console.error('[Admin Prospects] Exception updating:', error)
    return NextResponse.json(
      { error: 'Error al actualizar prospecto' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID del prospecto requerido' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('quote_prospects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Admin Prospects] Error deleting:', error)
      return NextResponse.json(
        { error: 'Error al eliminar prospecto' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Prospects] Exception deleting:', error)
    return NextResponse.json(
      { error: 'Error al eliminar prospecto' },
      { status: 500 }
    )
  }
}

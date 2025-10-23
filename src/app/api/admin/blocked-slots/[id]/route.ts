import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('blocked_slots')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting blocked slot:', error)
      return NextResponse.json(
        { error: 'Error al eliminar el bloque' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bloque eliminado',
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/blocked-slots/[id]:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el bloque' },
      { status: 500 }
    )
  }
}

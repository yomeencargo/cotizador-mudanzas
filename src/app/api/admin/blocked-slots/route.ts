import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST - Crear nuevo bloque
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { date, start_time, end_time, reason } = body

    if (!date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    const { data: blocked, error } = await supabaseAdmin
      .from('blocked_slots')
      .insert({
        date,
        start_time,
        end_time,
        reason: reason || 'Bloqueado',
        sync_from_calendar: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating blocked slot:', error)
      return NextResponse.json(
        { error: 'Error al bloquear el horario' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        blocked,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/admin/blocked-slots:', error)
    return NextResponse.json(
      { error: 'Error al bloquear el horario' },
      { status: 500 }
    )
  }
}

// GET - Obtener todos los bloques
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('blocked_slots')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching blocked slots:', error)
      return NextResponse.json(
        { error: 'Error obteniendo bloques' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/admin/blocked-slots:', error)
    return NextResponse.json(
      { error: 'Error obteniendo bloques' },
      { status: 500 }
    )
  }
}

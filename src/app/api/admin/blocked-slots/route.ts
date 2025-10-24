import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Obtener todos los horarios bloqueados
    const { data: blockedSlots, error } = await supabaseAdmin
      .from('blocked_slots')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching blocked slots:', error)
      return NextResponse.json(
        { error: 'Error obteniendo horarios bloqueados' },
        { status: 500 }
      )
    }

    return NextResponse.json(blockedSlots || [])
  } catch (error) {
    console.error('Error in /api/admin/blocked-slots:', error)
    return NextResponse.json(
      { error: 'Error obteniendo horarios bloqueados' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, start_time, end_time, reason, sync_from_calendar = false } = body

    // Validar datos
    if (!date || !start_time || !end_time || !reason) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    if (start_time >= end_time) {
      return NextResponse.json(
        { error: 'La hora de fin debe ser mayor a la hora de inicio' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un bloqueo en ese horario
    const { data: existingSlot } = await supabaseAdmin
      .from('blocked_slots')
      .select('id')
      .eq('date', date)
      .lte('start_time', start_time)
      .gt('end_time', start_time)
      .single()

    if (existingSlot) {
      return NextResponse.json(
        { error: 'Ya existe un bloqueo en ese horario' },
        { status: 409 }
      )
    }

    // Crear el bloqueo
    const { data: blockedSlot, error } = await supabaseAdmin
      .from('blocked_slots')
      .insert({
        date,
        start_time,
        end_time,
        reason,
        sync_from_calendar,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating blocked slot:', error)
      return NextResponse.json(
        { error: 'Error al crear el bloqueo de horario' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      blockedSlot,
      message: 'Horario bloqueado correctamente'
    }, { status: 201 })
  } catch (error) {
    console.error('Error in /api/admin/blocked-slots POST:', error)
    return NextResponse.json(
      { error: 'Error al crear el bloqueo de horario' },
      { status: 500 }
    )
  }
}
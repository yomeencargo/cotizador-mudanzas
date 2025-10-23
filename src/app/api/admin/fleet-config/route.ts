import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Obtener configuración actual
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('fleet_config')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching fleet config:', error)
      return NextResponse.json(
        { error: 'Error obteniendo configuración' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/admin/fleet-config:', error)
    return NextResponse.json(
      { error: 'Error obteniendo configuración' },
      { status: 500 }
    )
  }
}

// POST - Actualizar configuración
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { num_vehicles } = body

    if (!num_vehicles || num_vehicles < 1) {
      return NextResponse.json(
        { error: 'Número de vehículos inválido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('fleet_config')
      .update({
        num_vehicles,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating fleet config:', error)
      return NextResponse.json(
        { error: 'Error actualizando configuración' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/fleet-config:', error)
    return NextResponse.json(
      { error: 'Error actualizando configuración' },
      { status: 500 }
    )
  }
}

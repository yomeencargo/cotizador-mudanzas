import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Obtener configuración de flota
    const { data: config, error } = await supabaseAdmin
      .from('fleet_config')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching fleet config:', error)
      return NextResponse.json(
        { error: 'Error obteniendo configuración de flota' },
        { status: 500 }
      )
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error in /api/admin/fleet-config:', error)
    return NextResponse.json(
      { error: 'Error obteniendo configuración de flota' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { num_vehicles } = body

    if (!num_vehicles || num_vehicles < 1) {
      return NextResponse.json(
        { error: 'Número de vehículos debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Primero obtener el ID del registro existente
    const { data: existingConfig } = await supabaseAdmin
      .from('fleet_config')
      .select('id')
      .single()

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'No se encontró configuración de flota' },
        { status: 404 }
      )
    }

    // Actualizar configuración de flota
    const { data: config, error } = await supabaseAdmin
      .from('fleet_config')
      .update({ 
        num_vehicles,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingConfig.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating fleet config:', error)
      return NextResponse.json(
        { error: 'Error al actualizar la configuración de flota' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'Configuración de flota actualizada correctamente'
    })
  } catch (error) {
    console.error('Error in /api/admin/fleet-config PATCH:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la configuración de flota' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Obtener todos los items del catálogo
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('catalog_items')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching catalog items:', error)
      return NextResponse.json(
        { error: 'Error obteniendo items del catálogo' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in /api/admin/catalog-items:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      category,
      volume,
      weight,
      isFragile = false,
      isHeavy = false,
      isGlass = false,
      image = '📦',
      displayOrder = 0
    } = body

    // Validación
    if (!name || !category || volume === undefined || weight === undefined) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, category, volume, weight' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('catalog_items')
      .insert({
        name,
        category,
        volume,
        weight,
        is_fragile: isFragile,
        is_heavy: isHeavy,
        is_glass: isGlass,
        image,
        is_active: true,
        display_order: displayOrder,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating catalog item:', error)
      return NextResponse.json(
        { error: 'Error creando item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in /api/admin/catalog-items POST:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un item existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      category,
      volume,
      weight,
      isFragile,
      isHeavy,
      isGlass,
      image,
      isActive,
      displayOrder
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID del item es requerido' },
        { status: 400 }
      )
    }

    // Construir objeto de actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (category !== undefined) updateData.category = category
    if (volume !== undefined) updateData.volume = volume
    if (weight !== undefined) updateData.weight = weight
    if (isFragile !== undefined) updateData.is_fragile = isFragile
    if (isHeavy !== undefined) updateData.is_heavy = isHeavy
    if (isGlass !== undefined) updateData.is_glass = isGlass
    if (image !== undefined) updateData.image = image
    if (isActive !== undefined) updateData.is_active = isActive
    if (displayOrder !== undefined) updateData.display_order = displayOrder

    const { data, error } = await supabaseAdmin
      .from('catalog_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating catalog item:', error)
      return NextResponse.json(
        { error: 'Error actualizando item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in /api/admin/catalog-items PUT:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un item (marcar como inactivo o eliminar físicamente)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID del item es requerido' },
        { status: 400 }
      )
    }

    // Opción 1: Eliminar físicamente
    const { error } = await supabaseAdmin
      .from('catalog_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting catalog item:', error)
      return NextResponse.json(
        { error: 'Error eliminando item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
    
    /* Opción 2: Marcar como inactivo (comentado)
    const { error } = await supabaseAdmin
      .from('catalog_items')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deactivating catalog item:', error)
      return NextResponse.json(
        { error: 'Error desactivando item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
    */
  } catch (error) {
    console.error('Error in /api/admin/catalog-items DELETE:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


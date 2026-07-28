import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { deleteBookingPhotos } from '@/lib/deletePhotos'
import { getActiveCapacity } from '@/lib/fleetCapacity'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      status,
      notes,
      payment_type,
      payment_status,
      service_completed_at,
      scheduled_date,
      scheduled_time,
    } = body

    const reschedules = Boolean(scheduled_date || scheduled_time)

    if (
      !status &&
      !payment_type &&
      !payment_status &&
      service_completed_at === undefined &&
      notes === undefined &&
      !reschedules
    ) {
      return NextResponse.json(
        { error: 'No hay cambios que aplicar' },
        { status: 400 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {}
    if (status) updateData.status = status
    if (payment_type) updateData.payment_type = payment_type
    if (payment_status) updateData.payment_status = payment_status
    if (service_completed_at !== undefined) updateData.service_completed_at = service_completed_at

    // Cambio de fecha/hora: hay que validar que el cupo nuevo exista, o se puede
    // sobrevender un camión moviendo reservas a un horario ya lleno.
    if (reschedules) {
      const { data: current, error: currentErr } = await supabaseAdmin
        .from('bookings')
        .select('scheduled_date, scheduled_time, status, is_provisional')
        .eq('id', id)
        .single()

      if (currentErr || !current) {
        return NextResponse.json(
          { error: 'No se encontró la reserva a reprogramar' },
          { status: 404 }
        )
      }

      const newDate = scheduled_date || current.scheduled_date
      const newTime = scheduled_time || current.scheduled_time
      const movedSlot =
        newDate !== current.scheduled_date || newTime !== current.scheduled_time

      // Solo validamos capacidad si realmente cambia de slot y la reserva ocupa cupo.
      const occupiesSlot =
        !current.is_provisional &&
        !['cancelled', 'no_show'].includes(status || current.status)

      if (movedSlot && occupiesSlot) {
        const { data: fleet } = await supabaseAdmin
          .from('fleet_config')
          .select('*')
          .single()
        const capacity = getActiveCapacity(fleet)

        // Excluimos la propia reserva del conteo: se está moviendo, no duplicando.
        const { count: taken } = await supabaseAdmin
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('scheduled_date', newDate)
          .eq('scheduled_time', newTime)
          .in('status', ['confirmed', 'pending'])
          .neq('id', id)

        const { data: blocked } = await supabaseAdmin
          .from('blocked_slots')
          .select('id')
          .eq('date', newDate)
          .lte('start_time', newTime)
          .gt('end_time', newTime)

        if (blocked && blocked.length > 0) {
          return NextResponse.json(
            { error: 'Ese horario está bloqueado en la agenda' },
            { status: 409 }
          )
        }

        if ((taken || 0) >= capacity) {
          return NextResponse.json(
            {
              error: `Sin cupo a esa hora: ${taken}/${capacity} camiones ya ocupados`,
            },
            { status: 409 }
          )
        }
      }

      if (scheduled_date) updateData.scheduled_date = scheduled_date
      if (scheduled_time) updateData.scheduled_time = scheduled_time
    }

    // Si se marca como pago completo, sincronizar total_price con original_price
    if (payment_type === 'completo') {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('original_price, total_price')
        .eq('id', id)
        .single()

      if (!fetchError && existing && existing.original_price) {
        updateData.total_price = existing.original_price
      }
    }

    // Agregar timestamp según el estado
    if (status === 'confirmed' && !body.confirmed_at) {
      updateData.confirmed_at = new Date().toISOString()
    } else if (status === 'completed' && !body.completed_at) {
      updateData.completed_at = new Date().toISOString()
    } else if (status === 'cancelled' && !body.cancelled_at) {
      updateData.cancelled_at = new Date().toISOString()
    }

    // Agregar notas si se proporcionan
    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Si se marca como completada, eliminar las fotos automáticamente
    if (status === 'completed') {
      console.log('[PATCH Booking] Reserva marcada como completada, eliminando fotos...')
      
      // Obtener las fotos actuales antes de actualizar
      const { data: currentBooking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('photo_urls')
        .eq('id', id)
        .single()

      if (!fetchError && currentBooking?.photo_urls) {
        // Eliminar fotos de Supabase Storage
        const deleteResult = await deleteBookingPhotos(currentBooking.photo_urls)
        
        if (deleteResult.success) {
          console.log(`[PATCH Booking] ✓ ${deleteResult.deletedCount} foto(s) eliminada(s) exitosamente`)
          // Limpiar photo_urls en la BD
          updateData.photo_urls = []
        } else {
          console.error(`[PATCH Booking] Error eliminando fotos:`, deleteResult.errors)
          // Continuar con la actualización aunque falle la eliminación de fotos
        }
      } else {
        console.log('[PATCH Booking] No hay fotos para eliminar')
      }
    }

    // Actualizar la reserva
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating booking:', error)
      return NextResponse.json(
        { error: 'Error al actualizar la reserva' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      booking,
      message: status === 'completed' 
        ? 'Reserva completada y fotos eliminadas correctamente' 
        : 'Reserva actualizada correctamente'
    })
  } catch (error) {
    console.error('Error in /api/admin/bookings/[id]:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la reserva' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Eliminar la reserva
    const { error } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting booking:', error)
      return NextResponse.json(
        { error: 'Error al eliminar la reserva' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Reserva eliminada correctamente'
    })
  } catch (error) {
    console.error('Error in /api/admin/bookings/[id] DELETE:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la reserva' },
      { status: 500 }
    )
  }
}

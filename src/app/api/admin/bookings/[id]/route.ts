import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { deleteBookingPhotos } from '@/lib/deletePhotos'
import { getActiveCapacity } from '@/lib/fleetCapacity'
import { getFleetVehicleViews } from '@/lib/vehicleAssignment'
import {
  getActorFromRequest,
  logAdminAction,
  statusLabel,
  type FieldChange,
} from '@/lib/activityLog'
import { isAdministrator } from '@/lib/adminPermissions'

/** Etiqueta legible de una reserva, para poder leer el log aunque luego se borre. */
function bookingLabel(b: { client_name?: string | null; scheduled_date?: string | null }) {
  return [b?.client_name, b?.scheduled_date].filter(Boolean).join(' · ') || 'Reserva'
}

/**
 * Traduce el update a uno o más eventos de auditoría. Se emite un evento por TIPO de
 * cambio (reprogramación, estado, pago) para poder filtrarlos por separado después.
 */
async function logBookingUpdate(args: {
  request: NextRequest
  id: string
  before: Record<string, any> | null
  after: Record<string, any>
  updateData: Record<string, any>
}) {
  const { request, id, before, after, updateData } = args
  const actor = getActorFromRequest(request)
  const label = bookingLabel(after || before || {})
  const base = { actor, entityType: 'booking', entityId: id, entityLabel: label, request }

  // Reprogramación
  const dateChanged =
    'scheduled_date' in updateData && before?.scheduled_date !== after?.scheduled_date
  const timeChanged =
    'scheduled_time' in updateData && before?.scheduled_time !== after?.scheduled_time

  if (dateChanged || timeChanged) {
    const changes: Record<string, FieldChange> = {}
    if (dateChanged) {
      changes.scheduled_date = { from: before?.scheduled_date, to: after?.scheduled_date }
    }
    if (timeChanged) {
      changes.scheduled_time = { from: before?.scheduled_time, to: after?.scheduled_time }
    }
    await logAdminAction({
      ...base,
      action: 'booking.rescheduled',
      summary: `Reprogramó de ${before?.scheduled_date ?? '—'} ${String(
        before?.scheduled_time ?? ''
      ).slice(0, 5)} a ${after?.scheduled_date ?? '—'} ${String(
        after?.scheduled_time ?? ''
      ).slice(0, 5)}`,
      changes,
    })
  }

  // Cambio de camión: se registra aparte porque es la decisión que ven los choferes en
  // el link público, y hay que poder rastrear quién movió un trabajo de camión.
  if ('vehicle_id' in updateData && before?.vehicle_id !== after?.vehicle_id) {
    const fleet = await getFleetVehicleViews()
    const nameOf = (vid: number | null | undefined) =>
      vid == null ? 'Sin asignar' : fleet.find((v) => v.id === vid)?.name || `Camión ${vid}`
    await logAdminAction({
      ...base,
      action: 'booking.vehicle_assigned',
      summary: `Cambió el camión de ${nameOf(before?.vehicle_id)} a ${nameOf(after?.vehicle_id)}`,
      changes: { vehicle_id: { from: before?.vehicle_id ?? null, to: after?.vehicle_id ?? null } },
    })
  }

  // Cambio de estado
  if ('status' in updateData && before?.status !== after?.status) {
    await logAdminAction({
      ...base,
      action: 'booking.status_changed',
      summary: `Cambió el estado de ${statusLabel(before?.status)} a ${statusLabel(
        after?.status
      )}`,
      changes: { status: { from: before?.status, to: after?.status } },
    })
  }

  // Pagos
  const paymentChanges: Record<string, FieldChange> = {}
  if ('payment_type' in updateData && before?.payment_type !== after?.payment_type) {
    paymentChanges.payment_type = { from: before?.payment_type, to: after?.payment_type }
  }
  if ('payment_status' in updateData && before?.payment_status !== after?.payment_status) {
    paymentChanges.payment_status = {
      from: before?.payment_status,
      to: after?.payment_status,
    }
  }
  const isManualFinancialAdjustment =
    'adjusted_price' in updateData || 'adjustment_comment' in updateData
  if (
    !isManualFinancialAdjustment &&
    'amount_paid' in updateData &&
    Number(before?.amount_paid || 0) !== Number(after?.amount_paid || 0)
  ) {
    paymentChanges.amount_paid = {
      from: Number(before?.amount_paid || 0),
      to: Number(after?.amount_paid || 0),
    }
  }
  if (Object.keys(paymentChanges).length) {
    const parts: string[] = []
    if (paymentChanges.payment_status) {
      parts.push(
        `estado de pago: ${statusLabel(
          paymentChanges.payment_status.from as string
        )} → ${statusLabel(paymentChanges.payment_status.to as string)}`
      )
    }
    if (paymentChanges.payment_type) {
      parts.push(
        `tipo de pago: ${paymentChanges.payment_type.from ?? '—'} → ${
          paymentChanges.payment_type.to ?? '—'
        }`
      )
    }
    if (paymentChanges.amount_paid) {
      parts.push(
        `monto pagado: $${Number(paymentChanges.amount_paid.to || 0).toLocaleString('es-CL')}`
      )
    }
    await logAdminAction({
      ...base,
      action: 'booking.payment_updated',
      summary: `Actualizó el pago (${parts.join(', ')})`,
      changes: paymentChanges,
    })
  }

  const financialChanges: Record<string, FieldChange> = {}
  if (isManualFinancialAdjustment) {
    for (const field of ['adjusted_price', 'amount_paid', 'adjustment_comment']) {
      if (field in updateData && String(before?.[field] ?? '') !== String(after?.[field] ?? '')) {
        financialChanges[field] = { from: before?.[field] ?? null, to: after?.[field] ?? null }
      }
    }
  }
  if (Object.keys(financialChanges).length) {
    await logAdminAction({
      ...base,
      action: 'booking.amount_adjusted',
      summary: `Reajustó el servicio a $${Number(after.adjusted_price || after.original_price || after.total_price || 0).toLocaleString('es-CL')} y registró $${Number(after.amount_paid || 0).toLocaleString('es-CL')} pagados`,
      changes: financialChanges,
    })
  }
}

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
      vehicle_id,
      adjusted_price,
      amount_paid,
      adjustment_comment,
    } = body

    const reschedules = Boolean(scheduled_date || scheduled_time)
    const financialRequested =
      adjusted_price !== undefined ||
      amount_paid !== undefined ||
      adjustment_comment !== undefined

    if (
      !status &&
      !payment_type &&
      !payment_status &&
      service_completed_at === undefined &&
      notes === undefined &&
      vehicle_id === undefined &&
      !financialRequested &&
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

    // Reajustes posteriores al abono: doble barrera. La UI los oculta para Secretaría,
    // pero el permiso real se valida acá para que no se pueda saltar llamando la API.
    if (financialRequested) {
      if (!(await isAdministrator(request))) {
        return NextResponse.json(
          { error: 'Solo el perfil Administrador puede reajustar montos' },
          { status: 403 }
        )
      }

      const { data: currentFinancial, error: financialError } = await supabaseAdmin
        .from('bookings')
        .select(
          'payment_status, payment_type, original_price, total_price, adjusted_price, amount_paid, adjustment_comment'
        )
        .eq('id', id)
        .maybeSingle()

      if (financialError || !currentFinancial) {
        return NextResponse.json({ error: 'No se encontró la reserva' }, { status: 404 })
      }
      if (
        currentFinancial.payment_status !== 'approved' ||
        currentFinancial.payment_type !== 'mitad'
      ) {
        return NextResponse.json(
          { error: 'El reajuste está disponible después de confirmar el abono del 50%' },
          { status: 409 }
        )
      }

      const requestedAdjusted =
        adjusted_price === null
          ? null
          : adjusted_price === undefined
            ? currentFinancial.adjusted_price
            : Math.round(Number(adjusted_price))
      const quotedPrice = Number(
        currentFinancial.original_price || currentFinancial.total_price || 0
      )
      // Si el valor vuelve a coincidir con la cotización, se limpia el reajuste en vez
      // de guardar un falso "reajustado" con exactamente el mismo monto.
      const nextAdjusted =
        requestedAdjusted !== null && requestedAdjusted === quotedPrice
          ? null
          : requestedAdjusted
      const nextPaid =
        amount_paid === undefined
          ? Number(currentFinancial.amount_paid) || 0
          : Math.round(Number(amount_paid))
      const nextComment =
        adjustment_comment === undefined
          ? String(currentFinancial.adjustment_comment || '')
          : String(adjustment_comment || '').trim()

      const effectivePrice = nextAdjusted ?? quotedPrice
      if (!Number.isFinite(effectivePrice) || effectivePrice <= 0) {
        return NextResponse.json({ error: 'El monto final debe ser mayor que cero' }, { status: 400 })
      }
      if (!Number.isFinite(nextPaid) || nextPaid < 0) {
        return NextResponse.json({ error: 'El monto pagado no puede ser negativo' }, { status: 400 })
      }

      const financialChanged =
        String(currentFinancial.adjusted_price ?? '') !== String(nextAdjusted ?? '') ||
        Number(currentFinancial.amount_paid || 0) !== nextPaid ||
        String(currentFinancial.adjustment_comment || '') !== nextComment

      if (financialChanged && !nextComment) {
        return NextResponse.json(
          { error: 'Agrega el motivo del reajuste para dejar trazabilidad' },
          { status: 400 }
        )
      }

      if (financialChanged) {
        updateData.adjusted_price = nextAdjusted
        updateData.amount_paid = nextPaid
        updateData.adjustment_comment = nextComment
        updateData.adjusted_at = new Date().toISOString()
        updateData.adjusted_by = request.headers.get('x-admin-user') || 'administrador'
      }
    }

    // Asignación manual de camión. null = desasignar; el reparto automático la volverá a
    // tomar en la próxima lectura, así que "sin camión" es un estado transitorio a propósito.
    if (vehicle_id !== undefined) {
      if (vehicle_id === null) {
        updateData.vehicle_id = null
      } else {
        // Solo camiones activos: los que están en mantención salen de servicio y el
        // reparto automático les quita el trabajo, así que asignarlos no duraría nada.
        const fleetVehicles = await getFleetVehicleViews()
        const target = fleetVehicles.find((v) => v.id === vehicle_id)
        if (!target) {
          return NextResponse.json(
            { error: 'El camión indicado no existe en la flota' },
            { status: 400 }
          )
        }
        if (target.status === 'maintenance') {
          return NextResponse.json(
            { error: `${target.name} está en mantención: actívalo en Flota para asignarle trabajos` },
            { status: 409 }
          )
        }
        updateData.vehicle_id = vehicle_id
      }
    }

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

    // Al cerrar el saldo de una reserva que partió con abono, registrar el total real
    // como pagado. El precio cotizado/reajustado no se pisa. Solo aplica si el abono ya
    // estaba aprobado; cambiar una reserva impaga a "completo" no inventa un cobro.
    if (payment_type === 'completo') {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('original_price, total_price, adjusted_price, payment_status')
        .eq('id', id)
        .single()

      if (
        !fetchError &&
        existing &&
        (existing.payment_status === 'approved' || payment_status === 'approved')
      ) {
        const finalPrice = Number(
          existing.adjusted_price || existing.original_price || existing.total_price || 0
        )
        if (finalPrice > 0) updateData.amount_paid = Math.round(finalPrice)
      }
    }

    // "Marcar como pagado" también debe dejar un monto real. Flow escribe el valor
    // exacto por su propio webhook; esta rama cubre la confirmación manual del panel.
    if (payment_status === 'approved' && payment_type !== 'completo') {
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('original_price, total_price, adjusted_price, amount_paid, payment_type')
        .eq('id', id)
        .single()

      if (!fetchError && existing && (Number(existing.amount_paid) || 0) <= 0) {
        const finalPrice = Number(
          existing.adjusted_price || existing.original_price || existing.total_price || 0
        )
        const effectiveType = payment_type || existing.payment_type
        const ratio = effectiveType === 'mitad' ? 0.5 : effectiveType === 'completo' ? 0.95 : 1
        if (finalPrice > 0) updateData.amount_paid = Math.round(finalPrice * ratio)
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

    // Estado previo para el log (antes → después). Se lee aquí, justo antes de mutar.
    const { data: before } = await supabaseAdmin
      .from('bookings')
      .select(
        'client_name, scheduled_date, scheduled_time, status, payment_type, payment_status, vehicle_id, original_price, total_price, adjusted_price, amount_paid, adjustment_comment'
      )
      .eq('id', id)
      .maybeSingle()

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

    await logBookingUpdate({ request, id, before, after: booking, updateData })

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

    // Se leen los datos ANTES de borrar: después ya no hay de dónde sacarlos para el log.
    const { data: before } = await supabaseAdmin
      .from('bookings')
      .select('client_name, scheduled_date, scheduled_time, status, quote_id, total_price')
      .eq('id', id)
      .maybeSingle()

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

    await logAdminAction({
      actor: getActorFromRequest(request),
      action: 'booking.deleted',
      entityType: 'booking',
      entityId: id,
      entityLabel: bookingLabel(before || {}),
      summary: `Eliminó la reserva${before?.quote_id ? ` ${before.quote_id}` : ''} de ${
        before?.scheduled_date ?? '—'
      } ${String(before?.scheduled_time ?? '').slice(0, 5)}`,
      // Guardamos el registro borrado: es la única copia que queda de qué se eliminó.
      changes: before
        ? { deleted_booking: { from: before, to: null } }
        : null,
      request,
    })

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

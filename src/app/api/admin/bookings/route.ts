import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { mergeBookingQuoteDetails, type AdminBookingQuoteSource } from '@/lib/adminBookingQuoteData'
import { getActiveCapacity } from '@/lib/fleetCapacity'
import { getActorFromRequest, logAdminAction } from '@/lib/activityLog'
import { normalizeOrigin } from '@/lib/prospectSource'
import {
  ensureVehicleAssignments,
  getAllVehicleAssignments,
  getFleetVehicleViews,
  type AssignableBooking,
} from '@/lib/vehicleAssignment'

const PROSPECT_QUOTE_FIELDS = `
  id,
  quote_id,
  email,
  source,
  status,
  is_frequent,
  scheduled_date,
  scheduled_time,
  converted_booking_id,
  is_flexible,
  recommended_vehicle,
  total_volume,
  total_weight,
  total_distance,
  origin_floor,
  origin_has_elevator,
  origin_parking_distance,
  destination_floor,
  destination_has_elevator,
  destination_parking_distance,
  items_summary,
  additional_services,
  lead_key,
  created_at
`

async function fetchProspectQuoteDetails(bookings: any[]) {
  if (bookings.length === 0) return []

  const bookingIds = [...new Set(bookings.map((b) => b.id).filter(Boolean))]
  const quoteIds = [...new Set(bookings.map((b) => b.quote_id).filter(Boolean))]
  const emails = [
    ...new Set(
      bookings
        .map((b) => (typeof b.client_email === 'string' ? b.client_email.toLowerCase().trim() : ''))
        .filter(Boolean)
    ),
  ]

  const queries = []

  if (bookingIds.length > 0) {
    queries.push(
      supabaseAdmin
        .from('quote_prospects')
        .select(PROSPECT_QUOTE_FIELDS)
        .in('converted_booking_id', bookingIds)
        .order('created_at', { ascending: false })
    )
  }

  if (quoteIds.length > 0) {
    queries.push(
      supabaseAdmin
        .from('quote_prospects')
        .select(PROSPECT_QUOTE_FIELDS)
        .in('quote_id', quoteIds)
        .order('created_at', { ascending: false })
    )
  }

  if (emails.length > 0) {
    queries.push(
      supabaseAdmin
        .from('quote_prospects')
        .select(PROSPECT_QUOTE_FIELDS)
        .in('email', emails)
        .order('created_at', { ascending: false })
    )
  }

  // Las fichas "Cliente antiguo" clasifican a la persona completa y pueden no
  // compartir quote_id/fecha con reservas históricas. Se traen como catálogo pequeño
  // y el merge las cruza por email normalizado.
  queries.push(
    supabaseAdmin
      .from('quote_prospects')
      .select(PROSPECT_QUOTE_FIELDS)
      .eq('source', 'cliente_antiguo')
      .order('created_at', { ascending: false })
  )

  const results = await Promise.all(queries)
  const byId = new Map<string, any>()

  results.forEach(({ data, error }) => {
    if (error) {
      console.error('[API] Error fetching booking quote details:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return
    }

    const rows = data || []
    rows.forEach((row: any) => {
      if (row.id && !byId.has(row.id)) {
        byId.set(row.id, row)
      }
    })
  })

  return [...byId.values()]
}

export async function GET() {
  try {
    console.log('[API] Fetching bookings from database...')

    // Obtener todas las reservas con paginación
    // EXCLUIR reservas canceladas (pagos rechazados)
    //
    // `code` y `customer_id` los agrega add_public_ids.sql. La consulta se intenta CON
    // esas columnas y, si la migración todavía no está aplicada, se reintenta sin ellas
    // (ver más abajo): así desplegar antes o después de correr el SQL da lo mismo, y el
    // panel nunca se queda sin la lista de reservas por una columna que falta.
    const selectColumns = (withPublicIds: boolean) => `
        id,
        ${withPublicIds ? 'code,\n        customer_id,' : ''}
        quote_id,
        client_name,
        client_email,
        client_phone,
        scheduled_date,
        scheduled_time,
        duration_hours,
        status,
        notes,
        payment_type,
        payment_status,
        is_provisional,
        total_price,
        original_price,
        adjusted_price,
        amount_paid,
        adjustment_comment,
        adjusted_at,
        adjusted_by,
        payment_method,
        origin_address,
        destination_address,
        origin_floor,
        origin_has_elevator,
        origin_parking_distance,
        destination_floor,
        destination_has_elevator,
        destination_parking_distance,
        is_company,
        company_name,
        company_rut,
        pdf_url,
        pdf_generated_at,
        photo_urls,
        booking_type,
        visit_address,
        service_completed_at,
        created_at,
        confirmed_at,
        completed_at,
        cancelled_at
      `

    const fetchBookings = (withPublicIds: boolean) =>
      supabaseAdmin
        .from('bookings')
        .select(selectColumns(withPublicIds))
        .neq('status', 'cancelled') // NO mostrar reservas canceladas (pagos rechazados)
        .order('created_at', { ascending: false }) // Más recientes primero

    let { data: bookings, error } = await fetchBookings(true)

    // 42703 = undefined_column. Es la señal de que falta la migración de códigos.
    if (error?.code === '42703') {
      console.warn('[API] Sin códigos públicos todavía (¿falta add_public_ids.sql?). Reintentando sin ellos.')
      ;({ data: bookings, error } = await fetchBookings(false))
    }

    if (error) {
      console.error('[API] Error fetching bookings:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        { error: 'Error obteniendo reservas', details: error.message },
        { status: 500 }
      )
    }

    // El `select` se arma como string dinámico (con o sin códigos), así que Supabase ya
    // no puede inferir el tipo de las filas: se declara acá.
    const bookingRows = (bookings || []) as unknown as AdminBookingQuoteSource[]
    const prospects = await fetchProspectQuoteDetails(bookingRows)
    const enrichedBookings = mergeBookingQuoteDetails(bookingRows, prospects)

    // Camión de cada reserva. Las futuras que aún no tienen uno se reparten acá y quedan
    // guardadas, así el admin y el link de choferes ven siempre lo mismo.
    const vehicles = await getFleetVehicleViews()
    const assignments = await ensureVehicleAssignments(
      bookingRows as AssignableBooking[],
      vehicles,
      await getAllVehicleAssignments()
    )
    const withVehicle = enrichedBookings.map((b: any) => ({
      ...b,
      vehicle_id: assignments.get(b.id) ?? null,
    }))

    console.log(`[API] Successfully fetched ${withVehicle.length} bookings`)
    return NextResponse.json(withVehicle)
  } catch (error) {
    console.error('[API] Exception in /api/admin/bookings:', error)
    return NextResponse.json(
      {
        error: 'Error obteniendo reservas',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      quote_id,
      client_name,
      client_email,
      client_phone,
      scheduled_date,
      scheduled_time,
      duration_hours = 4,
      status = 'pending',
      payment_type,
      // Cómo se cobra: 'flow' (link de pago), 'transfer' (transferencia) o 'cash'
      // (efectivo). Para 'flow' el estado lo confirma después el webhook de Flow.
      payment_method,
      payment_status,
      total_price,
      original_price,
      amount_paid,
      origin_address,
      destination_address,
      notes,
      is_company = false,
      company_name,
      company_rut,
      customer_origin,
      skip_customer_record = false,
      override_capacity = false,
    } = body
    const capacityOverrideApproved = override_capacity === true

    if (!client_name || !client_email || !client_phone || !scheduled_date || !scheduled_time) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Obtener capacidad de flota (vehículos activos, no total)
    const { data: configData, error: configError } = await supabaseAdmin
      .from('fleet_config')
      .select('*')
      .single()

    if (configError || !configData) {
      return NextResponse.json(
        { error: 'Error obteniendo configuración de flota' },
        { status: 500 }
      )
    }

    const capacity = getActiveCapacity(configData)

    // Contar reservas activas para ese horario
    const { count: bookingCount } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('scheduled_date', scheduled_date)
      .eq('scheduled_time', scheduled_time)
      .in('status', ['confirmed', 'pending'])

    // Verificar bloqueos
    const { data: blockedData } = await supabaseAdmin
      .from('blocked_slots')
      .select('id')
      .eq('date', scheduled_date)
      .lte('start_time', scheduled_time)
      .gt('end_time', scheduled_time)

    const activeBookings = bookingCount || 0
    const availableSlots = (capacity || 0) - activeBookings
    const isBlocked = !!(blockedData && blockedData.length > 0)

    if ((availableSlots <= 0 || isBlocked) && !capacityOverrideApproved) {
      const conflictReason = isBlocked ? 'blocked' : 'full'
      const warning = isBlocked
        ? 'El horario está bloqueado en la agenda.'
        : `El horario ya tiene ${activeBookings} reserva${activeBookings === 1 ? '' : 's'} para una capacidad de ${capacity}.`
      return NextResponse.json(
        {
          error: 'Este horario requiere confirmación para crear un sobrecupo',
          requiresOverride: true,
          reason: conflictReason,
          warning,
          activeBookings,
          capacity,
        },
        { status: 409 }
      )
    }

    const bookingQuoteId = quote_id || `ADMIN-${Date.now()}`
    const customerOrigin = normalizeOrigin(customer_origin)
    let customerRecordId: string | null = null

    // Una reserva manual normal deja primero una ficha vinculable en la misma base de
    // contactos. Los bloqueos de agenda usan esta misma API pero no son clientes.
    if (!skip_customer_record) {
      const normalizedEmail = String(client_email).trim().toLowerCase()
      const { data: customerRecord, error: customerError } = await supabaseAdmin
        .from('quote_prospects')
        .upsert(
          {
            quote_id: bookingQuoteId,
            name: client_name,
            email: normalizedEmail,
            phone: client_phone,
            source: customerOrigin,
            status: 'converted',
            scheduled_date,
            scheduled_time,
            total_price: original_price || total_price || null,
            origin_address: origin_address || null,
            destination_address: destination_address || null,
            is_company,
            company_name: is_company ? company_name || null : null,
            company_rut: is_company ? company_rut || null : null,
            notes: notes || null,
            // La clave va por EMAIL, no por quote_id.
            //
            // Antes era `admin_booking:${bookingQuoteId}`, y como el quote_id lleva un
            // timestamp, cada reserva manual creaba una ficha NUEVA de la misma persona:
            // medido en produccion el 2-sep-2026, 25 fichas para 17 personas, una de
            // ellas repetida 4 veces. El selector de clientes las unificaba por email
            // igual, pero en Prospectos se veian todas.
            //
            // No se usa `manual_customer:${email}` a proposito: esa es la clave de las
            // fichas que se crean a mano desde Clientes, y compartirla haria que una
            // reserva pisara las notas y el origen de esa ficha.
            lead_key: `admin_booking:${normalizedEmail}`,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'lead_key' }
        )
        .select('id')
        .single()

      if (customerError || !customerRecord) {
        console.error('[API] Error linking manual booking origin:', customerError)
        return NextResponse.json(
          {
            error:
              customerError?.code === '23514'
                ? 'Falta aplicar la migración de origen Cliente antiguo'
                : 'No se pudo guardar el origen del cliente',
          },
          { status: 500 }
        )
      }
      customerRecordId = customerRecord.id
    }

    // Crear la reserva
    const { data: booking, error: createError } = await supabaseAdmin
      .from('bookings')
      .insert({
        quote_id: bookingQuoteId,
        client_name,
        client_email: String(client_email).trim().toLowerCase(),
        client_phone,
        scheduled_date,
        scheduled_time,
        duration_hours,
        status,
        payment_type,
        payment_method: payment_method || null,
        payment_status: payment_status || 'pending',
        total_price,
        original_price,
        amount_paid:
          amount_paid !== undefined
            ? Math.max(0, Math.round(Number(amount_paid) || 0))
            : payment_status === 'approved'
              ? payment_type === 'mitad'
                ? Math.round(Number(original_price || total_price || 0) * 0.5)
                : Math.round(Number(total_price || original_price || 0))
              : 0,
        origin_address,
        destination_address,
        notes,
        is_company,
        company_name: is_company ? company_name : null,
        company_rut: is_company ? company_rut : null,
      })
      .select()
      .single()

    if (createError) {
      console.error('[API] Error creating booking:', createError)
      return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 })
    }

    if (customerRecordId) {
      const { error: linkError } = await supabaseAdmin
        .from('quote_prospects')
        .update({ converted_booking_id: booking.id, updated_at: new Date().toISOString() })
        .eq('id', customerRecordId)
      if (linkError) {
        // El match por quote_id sigue conservando el origen; no deshacemos una reserva
        // ya creada por un fallo secundario del enlace directo.
        console.error('[API] Error linking customer record to booking:', linkError)
      }
    }

    const methodLabels: Record<string, string> = {
      flow: 'link de pago',
      transfer: 'transferencia',
      cash: 'efectivo',
    }
    await logAdminAction({
      actor: getActorFromRequest(request),
      action: 'booking.created',
      entityType: 'booking',
      entityId: booking.id,
      entityLabel: [booking.client_name, booking.scheduled_date].filter(Boolean).join(' · '),
      summary: `Creó una reserva manual${capacityOverrideApproved ? ' con sobrecupo confirmado' : ''} para ${booking.scheduled_date} ${String(
        booking.scheduled_time || ''
      ).slice(0, 5)}${
        payment_method ? ` (cobro: ${methodLabels[payment_method] || payment_method})` : ''
      }`,
      changes: {
        created: {
          from: null,
          to: {
            quote_id: booking.quote_id,
            client_name: booking.client_name,
            scheduled_date: booking.scheduled_date,
            scheduled_time: booking.scheduled_time,
            total_price: booking.total_price,
            payment_method: booking.payment_method,
            status: booking.status,
            customer_origin: customerOrigin,
            override_capacity: capacityOverrideApproved,
          },
        },
      },
      request,
    })

    return NextResponse.json(
      {
        success: true,
        booking,
        message: 'Reserva creada exitosamente',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] Exception in /api/admin/bookings POST:', error)
    return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 })
  }
}

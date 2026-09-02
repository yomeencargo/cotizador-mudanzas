import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { flowService } from '@/lib/flowService'
import { getActorFromRequest, logAdminAction } from '@/lib/activityLog'
import { isPaymentLedgerAvailable } from '@/lib/bookingPayments'
import { pendingAmount, servicePrice, actualPaidAmount } from '@/lib/revenueBreakdown'

export const dynamic = 'force-dynamic'

/** Lo que necesita esta ruta de la reserva. El `select` se arma como string, así que
 *  Supabase no puede inferir el tipo: se declara acá. */
interface BookingForBalance {
  id: string
  quote_id: string | null
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  status: string | null
  is_provisional: boolean | null
  payment_type: string | null
  payment_status: string | null
  total_price: number | null
  original_price: number | null
  adjusted_price: number | null
  amount_paid: number | null
}

/**
 * Genera un link de Flow por el SALDO que falta de una reserva.
 *
 * El monto NO se calcula acá: sale de `pendingAmount()`, que es la misma función que usa
 * el dashboard. Importa porque esa función sabe algo que una resta no sabe: quien pagó
 * "completo" pagó el 95% y el 5% restante es un DESCUENTO, no una deuda. Restando a mano,
 * a esos clientes se les cobraría plata que no deben.
 *
 * La orden se marca con `paymentType: 'saldo'` para que `paymentSync` la SUME a lo ya
 * cobrado en vez de ignorarla (una reserva ya aprobada no vuelve a escribir amount_paid).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(
        'id, quote_id, client_name, client_email, client_phone, status, is_provisional, ' +
          'payment_type, payment_status, total_price, original_price, adjusted_price, amount_paid'
      )
      .eq('id', params.id)
      .maybeSingle<BookingForBalance>()

    if (error || !booking) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }

    if (!booking.quote_id) {
      return NextResponse.json(
        { error: 'Esta reserva no tiene identificador de cotización, no se le puede cobrar por Flow' },
        { status: 400 }
      )
    }

    if (!booking.client_email) {
      return NextResponse.json(
        { error: 'La reserva no tiene email del cliente, y Flow lo necesita' },
        { status: 400 }
      )
    }

    const saldo = pendingAmount(booking)
    if (saldo <= 0) {
      // Se distingue el motivo porque son dos situaciones distintas para quien mira el panel.
      const razon =
        booking.payment_status === 'approved' && booking.payment_type === 'completo'
          ? 'Esta reserva se pagó completa (el 5% de diferencia es el descuento, no deuda)'
          : 'Esta reserva no tiene saldo pendiente'
      return NextResponse.json({ error: razon }, { status: 400 })
    }

    if (!flowService.isConfigured()) {
      return NextResponse.json(
        { error: 'Flow no está configurado. Revisá las variables de entorno.' },
        { status: 500 }
      )
    }

    // Sin el libro de pagos, un saldo cobrado NO se sumaría a `amount_paid`: la plata
    // entraría a Flow y el sistema seguiría mostrando la reserva como impaga. Es mejor no
    // dejar generar el link que generar uno cuyo cobro se pierde de vista.
    if (!(await isPaymentLedgerAvailable())) {
      return NextResponse.json(
        {
          error:
            'Falta correr la migración add_booking_payments.sql. Sin ella el pago del saldo no quedaría registrado en el sistema.',
        },
        { status: 409 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

    const flowResponse = await flowService.createPayment({
      // commerceOrder único por intento: Flow rechaza dos órdenes con el mismo id, y de
      // una reserva pueden salir varios intentos de cobro del saldo.
      commerceOrder: `${booking.quote_id}-saldo-${Date.now()}`,
      subject: `Saldo mudanza ${booking.quote_id} - Yo Me Encargo`,
      currency: 'CLP',
      amount: saldo,
      email: booking.client_email,
      urlConfirmation: `${appUrl}/api/payment/confirm`,
      urlReturn: `${appUrl}/api/payment/result`,
      // `bookingId` es el quote_id estable: así el webhook resuelve siempre la misma
      // reserva. `paymentType: 'saldo'` es lo que le dice a paymentSync que sume.
      optional: JSON.stringify({ bookingId: booking.quote_id, paymentType: 'saldo' }),
    })

    await logAdminAction({
      actor: getActorFromRequest(request),
      action: 'booking.balance_link_created',
      entityType: 'booking',
      entityId: booking.id,
      entityLabel: [booking.client_name, booking.quote_id].filter(Boolean).join(' · '),
      summary: `Generó link de pago por el saldo: $${saldo.toLocaleString('es-CL')}`,
      changes: {
        saldo: {
          from: null,
          to: {
            precio: servicePrice(booking),
            pagado: actualPaidAmount(booking),
            saldo,
          },
        },
      },
      request,
    })

    return NextResponse.json({
      success: true,
      url: flowResponse.url,
      token: flowResponse.token,
      amount: saldo,
      clientName: booking.client_name,
      clientPhone: booking.client_phone,
    })
  } catch (error) {
    console.error('Error generando el link de saldo:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'No se pudo generar el link de pago',
      },
      { status: 500 }
    )
  }
}

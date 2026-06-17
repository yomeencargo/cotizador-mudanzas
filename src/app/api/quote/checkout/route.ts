import { NextRequest, NextResponse } from 'next/server'
import { flowService } from '@/lib/flowService'
import {
  ensureProvisionalBooking,
  createQuoteFlowOrder,
  computeQuoteAmounts,
  SlotUnavailableError,
  type PaymentType,
} from '@/lib/quoteCheckout'

// Crea (o reutiliza) la pre-reserva y genera la orden Flow para pagar EN LA PÁGINA.
// Comparte la misma lógica que /api/prospects/send-quote => un solo booking por cotización.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      quoteId,
      paymentType,
      client,
      schedule,
      addresses,
      estimatedPrice,
      photoUrls,
    } = body as {
      quoteId: string
      paymentType: PaymentType
      client: any
      schedule: any
      addresses: any
      estimatedPrice: number
      photoUrls?: string[]
    }

    if (!quoteId || !paymentType || !client?.email || !estimatedPrice) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    if (!flowService.isConfigured()) {
      return NextResponse.json(
        { error: 'Flow no está configurado. Por favor contacta al administrador.' },
        { status: 500 }
      )
    }

    await ensureProvisionalBooking({
      quoteId,
      client,
      schedule,
      addresses,
      estimatedPrice,
      paymentType,
      photoUrls,
    })

    const amounts = computeQuoteAmounts(estimatedPrice)
    const amount = paymentType === 'completo' ? amounts.full95 : amounts.abono50
    const subject = `Servicio de Mudanza - ${
      paymentType === 'completo' ? 'Pago Completo' : 'Abono 50%'
    }`

    const order = await createQuoteFlowOrder({
      quoteId,
      paymentType,
      amount,
      email: client.email,
      subject,
    })

    return NextResponse.json({ success: true, paymentUrl: order.url, amount })
  } catch (error) {
    if (error instanceof SlotUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('[quote/checkout] Error:', error)
    return NextResponse.json(
      {
        error: 'Error al crear la orden de pago',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

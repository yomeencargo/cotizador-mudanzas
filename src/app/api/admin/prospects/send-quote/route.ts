import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { flowService } from '@/lib/flowService'
import {
  ensureProvisionalBooking,
  createQuoteFlowOrder,
  computeQuoteAmounts,
  SlotUnavailableError,
} from '@/lib/quoteCheckout'

const N8N_QUOTE_WEBHOOK_URL =
  process.env.N8N_QUOTE_WEBHOOK_URL ||
  'https://core.zensus.cl/webhook/d4594da2-04fb-44b3-baa5-5301e8f49521'

// Envío de cotización AJUSTADA desde el panel admin:
//  1) toma el prospecto, aplica el precio ajustado + comentario (si vienen)
//  2) garantiza la pre-reserva y actualiza su precio
//  3) genera DOS links de Flow (abono 50% y pago 100% con 5% dcto)
//  4) dispara el webhook de n8n => correo con ambos CTA + comentario de ajuste
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prospectId } = body as { prospectId?: string }
    const priceInput = body.price
    const commentInput = typeof body.comment === 'string' ? body.comment : undefined
    const dateInput = typeof body.date === 'string' && body.date ? body.date : undefined
    const timeInput = typeof body.time === 'string' && body.time ? body.time : undefined

    if (!prospectId) {
      return NextResponse.json({ error: 'prospectId requerido' }, { status: 400 })
    }

    // 1) Cargar el prospecto
    const { data: prospect, error: findError } = await supabaseAdmin
      .from('quote_prospects')
      .select('*')
      .eq('id', prospectId)
      .maybeSingle()

    if (findError || !prospect) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 })
    }

    if (!prospect.email || !prospect.name || !prospect.phone) {
      return NextResponse.json(
        { error: 'El prospecto no tiene nombre, email o teléfono completos' },
        { status: 400 }
      )
    }
    const effDate = dateInput || prospect.scheduled_date
    const effTime = timeInput || prospect.scheduled_time
    if (!effDate || !effTime) {
      return NextResponse.json(
        { error: 'Este prospecto no tiene fecha/hora de mudanza. Agrégalas en el modal antes de enviar.' },
        { status: 400 }
      )
    }

    // Precio efectivo: el que envía el admin > el ajustado guardado > el cotizado
    const parsedPrice =
      priceInput === undefined || priceInput === null || priceInput === ''
        ? null
        : Math.round(Number(priceInput))
    const effectivePrice =
      parsedPrice ?? prospect.adjusted_price ?? prospect.total_price

    if (!effectivePrice || effectivePrice <= 0) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
    }

    const comment =
      commentInput !== undefined ? commentInput : prospect.adjustment_comment || ''

    const quoteId = prospect.quote_id || `Q-PROS-${prospect.id}`

    const client = {
      name: prospect.name,
      email: prospect.email,
      phone: prospect.phone,
      isCompany: prospect.is_company || false,
      companyName: prospect.company_name,
      companyRut: prospect.company_rut,
    }
    const schedule = { date: effDate, time: effTime }
    const addresses = {
      origin: prospect.origin_address || undefined,
      destination: prospect.destination_address || undefined,
    }

    // 2) Pre-reserva idempotente + actualizar precio al ajustado
    await ensureProvisionalBooking({
      quoteId,
      client,
      schedule,
      addresses,
      estimatedPrice: effectivePrice,
      paymentType: 'mitad',
    })

    await supabaseAdmin
      .from('bookings')
      .update({ total_price: effectivePrice })
      .eq('quote_id', quoteId)

    // 3) Dos órdenes de Flow (best-effort): el correo NO debe depender del pago.
    //    Si Flow no está configurado o falla, se envía igual sin links de pago.
    const amounts = computeQuoteAmounts(effectivePrice)
    let paymentUrl50: string | null = null
    let paymentUrl100: string | null = null
    try {
      if (flowService.isConfigured()) {
        const order50 = await createQuoteFlowOrder({
          quoteId,
          paymentType: 'mitad',
          amount: amounts.abono50,
          email: client.email,
          subject: 'Servicio de Mudanza - Abono 50%',
        })
        const order100 = await createQuoteFlowOrder({
          quoteId,
          paymentType: 'completo',
          amount: amounts.full95,
          email: client.email,
          subject: 'Servicio de Mudanza - Pago 100% (5% dcto)',
        })
        paymentUrl50 = order50.url
        paymentUrl100 = order100.url
      } else {
        console.warn('[admin/send-quote] Flow no configurado: se envía el correo sin links de pago.')
      }
    } catch (flowError) {
      console.error('[admin/send-quote] Flow falló; se envía el correo sin links de pago:', flowError)
    }

    // 4) Payload a n8n (mismo webhook, ahora con ambos links + comentario)
    const payload = {
      event: 'quote_email_adjusted',
      prospect_id: prospect.id,
      quote_id: quoteId,
      cliente: {
        nombre: client.name,
        email: client.email,
        telefono: client.phone || null,
        es_empresa: client.isCompany,
        razon_social: client.isCompany ? client.companyName || null : null,
        rut: client.isCompany ? client.companyRut || null : null,
      },
      cotizacion: {
        origen: prospect.origin_address || null,
        destino: prospect.destination_address || null,
        fecha: prospect.scheduled_date || null,
        hora: prospect.scheduled_time || null,
        distancia_km: prospect.total_distance ?? null,
        volumen_m3: prospect.total_volume ?? null,
        vehiculo: prospect.recommended_vehicle || null,
        precio_total: amounts.estimated,
        precio_50: amounts.abono50,
        precio_100_con_descuento: amounts.full95,
        comentario_ajuste: comment || null,
      },
      pdf_url: prospect.pdf_url || null,
      pago: {
        flow_payment_url: paymentUrl50,
        flow_payment_url_100: paymentUrl100,
        monto: amounts.abono50,
        tipo: 'abono_50',
      },
    }

    const res = await fetch(N8N_QUOTE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[admin/send-quote] n8n respondió error:', res.status, text)
      return NextResponse.json(
        { error: 'No se pudo enviar la cotización por correo. Intenta de nuevo.' },
        { status: 502 }
      )
    }

    // Persistir ajuste + agenda + quote_id (para que el webhook convierta por quote_id) + marca de envío
    await supabaseAdmin
      .from('quote_prospects')
      .update({
        adjusted_price: parsedPrice ?? prospect.adjusted_price ?? null,
        adjustment_comment: comment || null,
        scheduled_date: effDate,
        scheduled_time: effTime,
        quote_id: quoteId,
        quote_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', prospect.id)

    return NextResponse.json({
      success: true,
      paymentUrl50,
      paymentUrl100,
      price: effectivePrice,
    })
  } catch (error) {
    if (error instanceof SlotUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('[admin/send-quote] Error:', error)
    return NextResponse.json(
      {
        error: 'Error al enviar la cotización',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

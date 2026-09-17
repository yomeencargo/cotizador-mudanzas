import { NextRequest, NextResponse } from 'next/server'
import { getActorFromRequest, logAdminAction } from '@/lib/activityLog'
import { QuoteProspectInputError, upsertQuoteProspect } from '@/lib/server/quoteProspects'

/**
 * COTIZACIÓN CARGADA DESDE EL PANEL.
 *
 * La secretaria usa los mismos pasos del cotizador web y llega con el precio calculado;
 * acá se guarda la cotización con ese cálculo y, si lo cambió, con el precio final que
 * acordó con el cliente. Todo en UNA escritura a propósito: si el ajuste fuera un segundo
 * paso y fallara, el prospecto quedaría con el precio calculado y el cron de seguimiento
 * (que corre cada hora) podría mandarle al cliente un correo con el precio equivocado.
 *
 * Qué queda guardado y dónde:
 *  - `total_price`     → precio calculado por el sistema.
 *  - `adjusted_price`  → precio final, solo si difiere del calculado.
 *  - el log de actividad → quién lo cambió, de cuánto a cuánto y por qué. Es la
 *    trazabilidad que no se pierde aunque el prospecto se vuelva a editar.
 *
 * No envía nada: el PDF se sube y la cotización se manda por las rutas de siempre
 * (`/api/prospects/upload-pdf` y `/api/admin/prospects/send-quote`), que ya leen el precio
 * final del prospecto guardado.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const quote = (body?.quote || {}) as Record<string, any>

    const calculated = Math.round(Number(quote.total_price))
    if (!Number.isFinite(calculated) || calculated <= 0) {
      return NextResponse.json(
        { error: 'La cotización no tiene un precio calculado. Vuelve al resumen y espera el cálculo.' },
        { status: 400 }
      )
    }

    const rawFinal = body?.final_price
    const final = Math.round(Number(rawFinal))
    if (rawFinal === undefined || rawFinal === null || rawFinal === '' || !Number.isFinite(final) || final <= 0) {
      return NextResponse.json({ error: 'El precio final debe ser un monto mayor que cero' }, { status: 400 })
    }

    // Sin fecha y hora la cotización no se puede enviar (el envío crea la pre-reserva y los
    // links de pago): mejor frenarla acá que guardarla a medias.
    if (!quote.scheduled_date || !quote.scheduled_time) {
      return NextResponse.json({ error: 'Falta la fecha u hora de la mudanza' }, { status: 400 })
    }

    const adjusted = final !== calculated
    const comment =
      typeof body?.adjustment_comment === 'string' && body.adjustment_comment.trim()
        ? body.adjustment_comment.trim()
        : null

    // La atribución de Google Ads se descarta aunque venga: en el panel sería la cookie de
    // la secretaria, no un clic del cliente.
    const { attribution: _ignorada, ...sinAtribucion } = quote

    const { prospect } = await upsertQuoteProspect(sinAtribucion, {
      adjusted_price: adjusted ? final : null,
      adjustment_comment: adjusted ? comment : null,
    })

    await logAdminAction({
      actor: getActorFromRequest(request),
      action: 'prospect.admin_quote_created',
      entityType: 'prospect',
      entityId: prospect.id,
      entityLabel: prospect.name || prospect.email || 'Lead',
      summary: adjusted
        ? `Cotizó desde el panel: calculado $${calculated.toLocaleString('es-CL')}, final $${final.toLocaleString('es-CL')} (${final > calculated ? '+' : '−'}$${Math.abs(final - calculated).toLocaleString('es-CL')})`
        : `Cotizó desde el panel por $${final.toLocaleString('es-CL')} (sin ajuste)`,
      changes: {
        quote: {
          from: null,
          to: {
            quote_id: prospect.quote_id,
            calculated_price: calculated,
            final_price: final,
            adjusted,
            adjustment_comment: adjusted ? comment : null,
          },
        },
      },
      request,
    })

    return NextResponse.json(
      {
        success: true,
        prospectId: prospect.id,
        quoteId: prospect.quote_id,
        calculatedPrice: calculated,
        finalPrice: final,
        adjusted,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof QuoteProspectInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('[admin/quotes] Error:', error)
    return NextResponse.json({ error: 'No se pudo guardar la cotización' }, { status: 500 })
  }
}

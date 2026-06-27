import { NextRequest, NextResponse } from 'next/server'
import { flowService } from '@/lib/flowService'
import { applyFlowPaymentByToken } from '@/lib/paymentSync'

// Webhook server-to-server: Flow notifica aquí el resultado del pago.
export async function POST(request: NextRequest) {
    try {
        // Flow envía los parámetros como form data
        const formData = await request.formData()

        const token = formData.get('token') as string
        const signature = formData.get('s') as string

        if (!token) {
            return NextResponse.json(
                { error: 'Token no proporcionado' },
                { status: 400 }
            )
        }

        // Verificar firma de Flow para seguridad
        const params: Record<string, any> = {}
        formData.forEach((value, key) => {
            params[key] = value
        })

        if (!flowService.verifySignature(params, signature)) {
            console.error('[WEBHOOK] Invalid Flow signature')
            return NextResponse.json(
                { error: 'Firma inválida' },
                { status: 401 }
            )
        }

        // Fuente única de verdad: resuelve la reserva por optional.bookingId, actualiza el
        // estado de pago de forma idempotente y convierte el prospecto si corresponde.
        await applyFlowPaymentByToken(token)

        // IMPORTANTE: Siempre responder 200 a Flow para confirmar la recepción.
        return new NextResponse('OK', { status: 200 })
    } catch (error) {
        console.error('Error processing Flow confirmation:', error)
        // Aún en caso de error respondemos 200 para no bloquear, pero registramos para depurar.
        return new NextResponse('OK', { status: 200 })
    }
}

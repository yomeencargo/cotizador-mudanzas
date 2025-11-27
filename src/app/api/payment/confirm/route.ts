import { NextRequest, NextResponse } from 'next/server'
import { flowService } from '@/lib/flowService'
import { createClient } from '@supabase/supabase-js'

// Este endpoint recibe la confirmación de pago desde Flow
export async function POST(request: NextRequest) {
    try {
        // Obtener parámetros del body (Flow envía como form data)
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
            console.error('Invalid Flow signature')
            return NextResponse.json(
                { error: 'Firma inválida' },
                { status: 401 }
            )
        }

        // Obtener estado del pago desde Flow
        const paymentStatus = await flowService.getPaymentStatus(token)
        console.log('[WEBHOOK] Payment status received:', {
            flowOrder: paymentStatus.flowOrder,
            commerceOrder: paymentStatus.commerceOrder,
            status: paymentStatus.status,
            amount: paymentStatus.amount
        })

        // Inicializar Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Extraer datos opcionales
        let bookingId: string | undefined
        let paymentType: string | undefined

        if (paymentStatus.optional) {
            try {
                const optional = JSON.parse(paymentStatus.optional)
                bookingId = optional.bookingId
                paymentType = optional.paymentType
            } catch (e) {
                console.error('Error parsing optional data:', e)
            }
        }

        // Determinar estado del pago
        // Flow status: 1 = pending, 2 = approved, 3 = rejected, 4 = cancelled
        let paymentStatusStr = 'pending'
        let bookingStatus = 'pending'
        
        if (paymentStatus.status === 2) {
            paymentStatusStr = 'approved'
            bookingStatus = 'confirmed' // Reserva confirmada si pago exitoso
        } else if (paymentStatus.status === 3) {
            paymentStatusStr = 'rejected'
            bookingStatus = 'cancelled' // Cancelar reserva si pago rechazado
        } else if (paymentStatus.status === 4) {
            paymentStatusStr = 'cancelled'
            bookingStatus = 'cancelled' // Cancelar reserva si pago cancelado
        }

        // Actualizar la reserva existente según el estado del pago
        const updateData: any = {
            flow_token: token,
            flow_order: paymentStatus.flowOrder,
            payment_status: paymentStatusStr,
            payment_date: paymentStatus.paymentData?.date || new Date().toISOString(),
            payment_method: paymentStatus.paymentData?.media || 'unknown',
        }

        // Si el pago fue exitoso, confirmar la reserva
        if (paymentStatus.status === 2) {
            updateData.status = 'confirmed'
        } 
        // Si el pago fue rechazado o cancelado, cancelar la reserva
        else if (paymentStatus.status === 3 || paymentStatus.status === 4) {
            updateData.status = 'cancelled'
        }

        const { error: updateError } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('quote_id', paymentStatus.commerceOrder)

        if (updateError) {
            console.error('[WEBHOOK] Error updating booking:', updateError)
        } else {
            console.log(`[WEBHOOK] Booking ${paymentStatus.commerceOrder} updated successfully:`, {
                status: updateData.status,
                payment_status: paymentStatusStr
            })
            
            // Si el pago fue rechazado o cancelado, eliminar la reserva después de 1 minuto
            // para mantener la base de datos limpia
            if (paymentStatus.status === 3 || paymentStatus.status === 4) {
                console.log(`[WEBHOOK] Scheduling deletion of cancelled booking: ${paymentStatus.commerceOrder}`)
                setTimeout(async () => {
                    try {
                        const { error: deleteError } = await supabase
                            .from('bookings')
                            .delete()
                            .eq('quote_id', paymentStatus.commerceOrder)
                            .eq('status', 'cancelled')
                        
                        if (deleteError) {
                            console.error('[WEBHOOK] Error deleting cancelled booking:', deleteError)
                        } else {
                            console.log(`[WEBHOOK] Cancelled booking ${paymentStatus.commerceOrder} deleted successfully`)
                        }
                    } catch (err) {
                        console.error('[WEBHOOK] Exception deleting cancelled booking:', err)
                    }
                }, 60000) // 1 minuto
            }
        }

        // IMPORTANTE: Siempre responder con HTTP 200 a Flow
        // para confirmar que recibimos la notificación
        return new NextResponse('OK', { status: 200 })
    } catch (error) {
        console.error('Error processing Flow confirmation:', error)
        // Aún en caso de error, respondemos 200 para evitar reintentos
        return new NextResponse('OK', { status: 200 })
    }
}

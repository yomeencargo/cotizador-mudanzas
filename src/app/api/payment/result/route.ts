import { NextRequest, NextResponse } from 'next/server'
import { flowService } from '@/lib/flowService'

// Función para generar HTML de redirección
function createRedirectHtml(url: string, message: string) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="0;url=${url}">
    <title>${message}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        a {
            color: white;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>${message}</h2>
        <p>Redirigiendo...</p>
        <p><a href="${url}">Haz clic aquí si no eres redirigido automáticamente</a></p>
    </div>
    <script>
        window.location.href = "${url}";
    </script>
</body>
</html>
`
}

// Función común para procesar el resultado del pago
async function processPaymentResult(token: string, baseUrl: string) {
    console.log('Token recibido:', token)
    console.log('Consultando estado a Flow...')

    // Usar NEXT_PUBLIC_APP_URL para asegurar que siempre redirigimos al dominio correcto
    // Esto evita problemas cuando Flow redirige desde una URL antigua (ej: Vercel)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const origin = new URL(appUrl).origin

    // Obtener estado del pago desde Flow
    let paymentStatus;
    try {
        paymentStatus = await flowService.getPaymentStatus(token)
        console.log('Estado recibido de Flow:', paymentStatus)
    } catch (flowError) {
        console.error('Error al consultar estado a Flow:', flowError)
        return {
            url: `${origin}/pago/error?reason=error&details=flow_connection_error`,
            message: 'Error de conexión'
        }
    }

    // ===== ACTUALIZAR RESERVA EN LA BASE DE DATOS =====
    // Como Flow no siempre envía el webhook en sandbox, actualizamos aquí
    let bookingData: any = null
    try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Primero, obtener la reserva para saber su tipo
        const { data: existingBooking } = await supabase
            .from('bookings')
            .select('id, booking_type, client_name, client_email, visit_address')
            .eq('quote_id', paymentStatus.commerceOrder)
            .single()

        bookingData = existingBooking

        // Determinar estado del pago
        let paymentStatusStr = 'pending'
        let bookingStatus = 'pending'
        
        if (paymentStatus.status === 2) {
            paymentStatusStr = 'approved'
            bookingStatus = 'confirmed'
        } else if (paymentStatus.status === 3) {
            paymentStatusStr = 'rejected'
            bookingStatus = 'cancelled'
        } else if (paymentStatus.status === 4) {
            paymentStatusStr = 'cancelled'
            bookingStatus = 'cancelled'
        }

        // Actualizar la reserva
        const updateData: any = {
            flow_token: token,
            flow_order: paymentStatus.flowOrder,
            payment_status: paymentStatusStr,
            payment_date: paymentStatus.paymentData?.date || new Date().toISOString(),
            payment_method: paymentStatus.paymentData?.media || 'unknown',
            status: bookingStatus,
        }

        console.log(`[RESULT] Actualizando reserva ${paymentStatus.commerceOrder} con status: ${bookingStatus}, payment: ${paymentStatusStr}`)

        const { error: updateError } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('quote_id', paymentStatus.commerceOrder)

        if (updateError) {
            console.error('[RESULT] Error updating booking:', updateError)
        } else {
            console.log(`[RESULT] Reserva ${paymentStatus.commerceOrder} actualizada exitosamente`)
            
            // Si el pago fue rechazado o cancelado, eliminar la reserva
            if (paymentStatus.status === 3 || paymentStatus.status === 4) {
                console.log(`[RESULT] Eliminando reserva cancelada: ${paymentStatus.commerceOrder}`)
                const { error: deleteError } = await supabase
                    .from('bookings')
                    .delete()
                    .eq('quote_id', paymentStatus.commerceOrder)
                    .eq('status', 'cancelled')
                
                if (deleteError) {
                    console.error('[RESULT] Error deleting cancelled booking:', deleteError)
                } else {
                    console.log(`[RESULT] Reserva cancelada eliminada`)
                }
            }
        }
    } catch (dbError) {
        console.error('[RESULT] Error actualizando base de datos:', dbError)
    }

    // Verificar estado del pago para redirigir al usuario
    // Flow status: 1 = pending, 2 = approved, 3 = rejected, 4 = cancelled
    if (paymentStatus.status === 2) {
        console.log('Pago APROBADO. Redirigiendo a éxito...')
        
        // Determinar si es cotización a domicilio o mudanza online
        // Método 1: Por el campo booking_type (si existe la migración)
        // Método 2: Por el prefijo del quote_id "DOMICILIO-" (fallback)
        const isDomicilio = (bookingData && bookingData.booking_type === 'domicilio') || 
                           paymentStatus.commerceOrder.startsWith('DOMICILIO-')
        
        console.log('[RESULT] Tipo de reserva detectado:', isDomicilio ? 'DOMICILIO' : 'ONLINE')
        console.log('[RESULT] commerceOrder:', paymentStatus.commerceOrder)
        console.log('[RESULT] booking_type:', bookingData?.booking_type)
        
        if (isDomicilio) {
            console.log('Redirigiendo a página de éxito de cotización a domicilio...')
            const params = new URLSearchParams({
                token: token,
                order: paymentStatus.flowOrder.toString(),
                amount: paymentStatus.amount.toString(),
                bookingId: bookingData?.id || '',
                clientName: bookingData?.client_name || '',
                clientEmail: bookingData?.client_email || '',
                visitAddress: bookingData?.visit_address || ''
            })
            return {
                url: `${origin}/domicilio/exito?${params.toString()}`,
                message: '¡Pago Exitoso!'
            }
        } else {
            console.log('Redirigiendo a página de éxito de mudanza online...')
        const params = new URLSearchParams({
            token: token,
            order: paymentStatus.flowOrder.toString(),
            amount: paymentStatus.amount.toString(),
                quoteId: paymentStatus.commerceOrder
        })
        return {
            url: `${origin}/pago/exito?${params.toString()}`,
            message: '¡Pago Exitoso!'
            }
        }
    } else if (paymentStatus.status === 3) {
        console.log('Pago RECHAZADO')
        return {
            url: `${origin}/pago/error?reason=rejected`,
            message: 'Pago Rechazado'
        }
    } else if (paymentStatus.status === 4) {
        console.log('Pago CANCELADO')
        return {
            url: `${origin}/pago/error?reason=cancelled`,
            message: 'Pago Cancelado'
        }
    } else {
        console.log('Pago PENDIENTE o estado desconocido:', paymentStatus.status)
        return {
            url: `${origin}/pago/error?reason=pending`,
            message: 'Pago Pendiente'
        }
    }
}

// Este endpoint maneja el retorno del usuario después del pago via GET
export async function GET(request: NextRequest) {
    try {
        console.log('Procesando retorno de pago (GET)...')
        const token = request.nextUrl.searchParams.get('token')

        if (!token) {
            console.error('Error: No token provided in query params')
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const origin = new URL(appUrl).origin
            const html = createRedirectHtml(`${origin}/pago/error?reason=no_token`, 'Error')
            return new NextResponse(html, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            })
        }

        const result = await processPaymentResult(token, request.url)
        const html = createRedirectHtml(result.url, result.message)
        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
    } catch (error) {
        console.error('Error processing payment result GET (Critical):', error)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const origin = new URL(appUrl).origin
        const html = createRedirectHtml(`${origin}/pago/error?reason=error`, 'Error')
        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
    }
}

// Este endpoint maneja el retorno del usuario después del pago via POST
// Flow envía el token via POST cuando el usuario completa el pago
export async function POST(request: NextRequest) {
    try {
        console.log('Procesando retorno de pago (POST)...')
        
        // Flow envía el token en el body como form-urlencoded
        const formData = await request.formData()
        const token = formData.get('token') as string

        if (!token) {
            console.error('Error: No token provided in POST body')
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const origin = new URL(appUrl).origin
            const html = createRedirectHtml(`${origin}/pago/error?reason=no_token`, 'Error')
            return new NextResponse(html, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            })
        }

        const result = await processPaymentResult(token, request.url)
        const html = createRedirectHtml(result.url, result.message)
        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
    } catch (error) {
        console.error('Error processing payment result POST (Critical):', error)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const origin = new URL(appUrl).origin
        const html = createRedirectHtml(`${origin}/pago/error?reason=error`, 'Error')
        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
    }
}

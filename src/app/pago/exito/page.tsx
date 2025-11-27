'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { CheckCircle, Home, Mail, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

function PaymentSuccessContent() {
    const searchParams = useSearchParams()
    const [paymentInfo, setPaymentInfo] = useState({
        token: '',
        order: '',
        amount: '',
    })

    useEffect(() => {
        setPaymentInfo({
            token: searchParams.get('token') || '',
            order: searchParams.get('order') || '',
            amount: searchParams.get('amount') || '',
        })
    }, [searchParams])

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Card variant="elevated" className="py-12">
                    {/* Icono de éxito */}
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle className="w-16 h-16 text-green-600" />
                    </div>

                    {/* Título */}
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
                        ¡Pago Exitoso!
                    </h1>

                    <p className="text-lg text-gray-600 mb-8 text-center">
                        Tu pago ha sido procesado correctamente
                    </p>

                    {/* Detalles del pago */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <h3 className="font-semibold text-blue-900 mb-4 text-center">
                            📋 Detalles de la Transacción
                        </h3>
                        <div className="space-y-3">
                            {paymentInfo.order && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Número de Orden:</span>
                                    <span className="font-semibold text-gray-900">#{paymentInfo.order}</span>
                                </div>
                            )}
                            {paymentInfo.amount && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Monto Pagado:</span>
                                    <span className="font-bold text-green-600 text-xl">
                                        {formatCurrency(parseInt(paymentInfo.amount))}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Estado:</span>
                                <span className="font-semibold text-green-600">✓ Aprobado</span>
                            </div>
                        </div>
                    </div>

                    {/* Próximos pasos */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <h3 className="font-semibold mb-3 text-blue-900">📧 ¿Qué sigue?</h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✅</span>
                                <span>Recibirás un correo de confirmación con los detalles de tu pago</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✅</span>
                                <span>Te contactaremos vía WhatsApp para confirmar detalles de la mudanza</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✅</span>
                                <span>Un ejecutivo te llamará en las próximas 24 horas</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✅</span>
                                <span>Recibirás recordatorios antes de la fecha programada</span>
                            </li>
                        </ul>
                    </div>

                    {/* Acciones */}
                    <div className="space-y-3">
                        <Link href="/cotizador">
                            <Button variant="primary" className="w-full" size="lg">
                                <Home className="w-5 h-5 mr-2" />
                                Volver al Inicio
                            </Button>
                        </Link>

                        <Button variant="outline" className="w-full" size="lg">
                            <Mail className="w-5 h-5 mr-2" />
                            Enviar Comprobante por Email
                        </Button>
                    </div>

                    {/* Información de contacto */}
                    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                        <p className="text-sm text-gray-600 mb-2">
                            ¿Necesitas ayuda? Contáctanos:
                        </p>
                        <p className="text-sm font-semibold text-primary-600">
                            📞 +56 9 XXXX XXXX | 📧 contacto@yomeencargo.cl
                        </p>
                    </div>
                </Card>

                {/* Nota de seguridad */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        🔒 Tu pago fue procesado de forma segura a través de Flow
                    </p>
                </div>
            </div>
        </div>
    )
}

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Card variant="elevated" className="py-12">
                    <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-16 h-16 text-primary-600 animate-spin mb-4" />
                        <p className="text-gray-600">Cargando información del pago...</p>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <PaymentSuccessContent />
        </Suspense>
    )
}

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { CheckCircle, Home, Mail, Loader2, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { generateBookingPDF } from '@/lib/pdfGenerator'
import toast from 'react-hot-toast'

function PaymentSuccessContent() {
    const searchParams = useSearchParams()
    const [paymentInfo, setPaymentInfo] = useState({
        token: '',
        order: '',
        amount: '',
        quoteId: '',
    })
    const [isDownloading, setIsDownloading] = useState(false)
    const [isPdfUploaded, setIsPdfUploaded] = useState(false)
    const [isUploadingPdf, setIsUploadingPdf] = useState(false)

    useEffect(() => {
        setPaymentInfo({
            token: searchParams.get('token') || '',
            order: searchParams.get('order') || '',
            amount: searchParams.get('amount') || '',
            quoteId: searchParams.get('quoteId') || '',
        })
    }, [searchParams])

    // Subir PDF automáticamente cuando se carga la página
    useEffect(() => {
        const uploadPdfAutomatically = async () => {
            // Solo subir si tenemos los datos necesarios y no se ha subido ya
            if (!paymentInfo.quoteId || isPdfUploaded || isUploadingPdf) {
                return
            }

            try {
                setIsUploadingPdf(true)
                console.log('[PDF Auto] Iniciando subida automática de PDF...')
                console.log('[PDF Auto] Quote ID:', paymentInfo.quoteId)

                // Generar el PDF (sin descargarlo)
                const pdfResult = await generateBookingPDF(paymentInfo, false) // false = no descargar
                
                if (!pdfResult) {
                    console.error('[PDF Auto] No se pudo generar el PDF')
                    return
                }

                console.log('[PDF Auto] PDF generado:', pdfResult.fileName)

                // Subir a Supabase Storage
                const formData = new FormData()
                formData.append('pdf', pdfResult.blob, pdfResult.fileName)
                formData.append('quoteId', paymentInfo.quoteId)

                const uploadResponse = await fetch('/api/bookings/upload-pdf', {
                    method: 'POST',
                    body: formData
                })

                if (uploadResponse.ok) {
                    const successData = await uploadResponse.json()
                    console.log('[PDF Auto] PDF subido exitosamente:', successData)
                    setIsPdfUploaded(true)
                    toast.success('✅ Comprobante generado y guardado', { duration: 2000 })
                } else {
                    const errorData = await uploadResponse.json().catch(() => ({}))
                    console.error('[PDF Auto] Error al subir:', errorData)
                }
            } catch (error) {
                console.error('[PDF Auto] Error:', error)
            } finally {
                setIsUploadingPdf(false)
            }
        }

        uploadPdfAutomatically()
    }, [paymentInfo, isPdfUploaded, isUploadingPdf])

    const handleDownloadPDF = async () => {
        try {
            setIsDownloading(true)
            
            console.log('[PDF Download] Descargando copia del PDF...')
            
            // Generar y descargar el PDF (true = descargar al dispositivo)
            const pdfResult = await generateBookingPDF(paymentInfo, true)
            
            if (!pdfResult) {
                throw new Error('No se pudo generar el PDF')
            }

            console.log('[PDF Download] PDF descargado:', pdfResult.fileName)
            toast.success('📥 PDF descargado exitosamente')
            
        } catch (error) {
            console.error('[PDF Download] Error:', error)
            toast.error('Error al descargar el PDF')
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-blue-light via-white to-white py-12 px-4">
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
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
                        <h3 className="font-semibold text-primary-900 mb-4 text-center">
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
                    <div className="bg-gradient-to-r from-brand-blue-light to-brand-blue-light border border-brand-blue rounded-lg p-6 mb-8">
                        <h3 className="font-semibold mb-3 text-primary-900">📧 ¿Qué sigue?</h3>
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
                        <Button 
                            variant="primary" 
                            className="w-full" 
                            size="lg"
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Generando PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5 mr-2" />
                                    Descargar Comprobante PDF
                                </>
                            )}
                        </Button>

                        <Link href="/cotizador">
                            <Button variant="outline" className="w-full" size="lg">
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
        <div className="min-h-screen bg-gradient-to-br from-brand-blue-light via-white to-white py-12 px-4">
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

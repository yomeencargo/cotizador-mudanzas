import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('[upload-pdf] Iniciando proceso de subida de PDF...')
    const formData = await request.formData()
    const pdfFile = formData.get('pdf') as File
    const quoteId = formData.get('quoteId') as string

    console.log('[upload-pdf] Quote ID recibido:', quoteId)
    console.log('[upload-pdf] PDF file:', pdfFile ? `${pdfFile.name} (${pdfFile.size} bytes)` : 'No file')

    if (!pdfFile || !quoteId) {
      console.error('[upload-pdf] ERROR: PDF o quote ID faltante')
      return NextResponse.json(
        { error: 'PDF o quote ID faltante' },
        { status: 400 }
      )
    }

    // Convertir File a ArrayBuffer
    const arrayBuffer = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generar nombre único para el archivo
    const fileName = `${quoteId}_${Date.now()}.pdf`
    const filePath = `booking-pdfs/${fileName}`

    // Subir a Supabase Storage
    console.log('[upload-pdf] Subiendo a Storage, ruta:', filePath)
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('bookings')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('[upload-pdf] ERROR al subir a Storage:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir el PDF', details: uploadError.message },
        { status: 500 }
      )
    }

    console.log('[upload-pdf] PDF subido exitosamente a Storage')

    // Obtener URL pública del PDF
    const { data: urlData } = supabaseAdmin
      .storage
      .from('bookings')
      .getPublicUrl(filePath)

    const pdfUrl = urlData.publicUrl
    console.log('[upload-pdf] URL pública generada:', pdfUrl)

    // Actualizar la reserva con la URL del PDF
    console.log('[upload-pdf] Actualizando booking con quote_id:', quoteId)
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        pdf_url: pdfUrl,
        pdf_generated_at: new Date().toISOString()
      })
      .eq('quote_id', quoteId)
      .select()

    if (updateError) {
      console.error('[upload-pdf] ERROR al actualizar booking:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la reserva con el PDF', details: updateError.message },
        { status: 500 }
      )
    }

    if (!updateData || updateData.length === 0) {
      console.error('[upload-pdf] ERROR: No se encontró booking con quote_id:', quoteId)
      return NextResponse.json(
        { error: 'No se encontró la reserva con ese ID', quoteId },
        { status: 404 }
      )
    }

    console.log('[upload-pdf] Booking actualizado exitosamente:', updateData[0].id)

    return NextResponse.json({
      success: true,
      pdfUrl,
      message: 'PDF subido y guardado exitosamente'
    })

  } catch (error) {
    console.error('Error in /api/bookings/upload-pdf:', error)
    return NextResponse.json(
      { error: 'Error al procesar el PDF' },
      { status: 500 }
    )
  }
}

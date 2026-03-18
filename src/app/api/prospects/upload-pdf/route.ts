import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get('pdf') as File
    const prospectId = formData.get('prospectId') as string
    const prospectEmail = formData.get('prospectEmail') as string

    console.log('[prospect-pdf] Recibido - prospectId:', prospectId, 'email:', prospectEmail)

    if (!pdfFile || (!prospectId && !prospectEmail)) {
      return NextResponse.json(
        { error: 'PDF y (prospectId o prospectEmail) son requeridos' },
        { status: 400 }
      )
    }

    const arrayBuffer = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const identifier = prospectId || prospectEmail || 'unknown'
    const fileName = `prospect_${identifier}_${Date.now()}.pdf`
    const filePath = `prospect-pdfs/${fileName}`

    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('bookings')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('[prospect-pdf] Error subiendo a Storage:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir el PDF' },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin
      .storage
      .from('bookings')
      .getPublicUrl(filePath)

    const pdfUrl = urlData.publicUrl
    console.log('[prospect-pdf] PDF subido, URL:', pdfUrl)

    const updatePayload = {
      pdf_url: pdfUrl,
      pdf_generated_at: new Date().toISOString(),
    }

    // Intentar actualizar por ID primero
    if (prospectId) {
      const { data: byId, error: errById } = await supabaseAdmin
        .from('quote_prospects')
        .update(updatePayload)
        .eq('id', prospectId)
        .select('id')

      if (!errById && byId && byId.length > 0) {
        console.log('[prospect-pdf] Prospecto actualizado por ID:', byId[0].id)
        return NextResponse.json({ success: true, pdfUrl })
      }
      console.warn('[prospect-pdf] No se encontró por ID, intentando por email...')
    }

    // Fallback: actualizar el prospecto más reciente con ese email
    if (prospectEmail) {
      const { data: byEmail, error: errByEmail } = await supabaseAdmin
        .from('quote_prospects')
        .update(updatePayload)
        .eq('email', prospectEmail.toLowerCase().trim())
        .is('pdf_url', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .select('id')

      if (!errByEmail && byEmail && byEmail.length > 0) {
        console.log('[prospect-pdf] Prospecto actualizado por email:', byEmail[0].id)
        return NextResponse.json({ success: true, pdfUrl })
      }
      console.error('[prospect-pdf] Tampoco se encontró por email')
    }

    console.error('[prospect-pdf] No se pudo vincular el PDF a ningún prospecto')
    return NextResponse.json({ success: true, pdfUrl, warning: 'PDF subido pero no vinculado' })
  } catch (error) {
    console.error('[prospect-pdf] Exception:', error)
    return NextResponse.json(
      { error: 'Error al procesar el PDF' },
      { status: 500 }
    )
  }
}

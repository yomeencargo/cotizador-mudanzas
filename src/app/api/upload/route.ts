import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// Este endpoint maneja la subida de imágenes
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('photos') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron archivos' },
        { status: 400 }
      )
    }

    const uploadedFiles = []

    for (const file of files) {
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `El archivo ${file.name} excede el tamaño máximo de 5MB` },
          { status: 400 }
        )
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: `El archivo ${file.name} no es una imagen válida` },
          { status: 400 }
        )
      }

      // En producción, aquí subirías a un servicio como AWS S3, Cloudinary, etc.
      // Por ahora, guardamos localmente
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const filename = `${Date.now()}-${file.name.replace(/\s/g, '-')}`
      const path = join(process.cwd(), 'public', 'uploads', filename)
      
      await writeFile(path, buffer)

      uploadedFiles.push({
        filename,
        url: `/uploads/${filename}`,
        size: file.size,
      })
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json(
      { error: 'Error al subir los archivos' },
      { status: 500 }
    )
  }
}


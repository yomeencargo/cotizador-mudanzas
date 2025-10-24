import jsPDF from 'jspdf'
import { useQuoteStore } from '@/store/quoteStore'
import { formatDate, formatTime, formatCurrency } from './utils'

export const generateQuotePDF = async () => {
  // Verificar que estamos en el cliente
  if (typeof window === 'undefined') {
    console.error('generateQuotePDF debe ejecutarse solo en el cliente')
    return
  }

  const {
    personalInfo,
    dateTime,
    isFlexible,
    origin,
    destination,
    items,
    additionalServices,
    totalVolume,
    totalWeight,
    estimatedPrice,
    recommendedVehicle,
  } = useQuoteStore.getState()

  // Crear nuevo documento PDF
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Colores
  const primaryColor: [number, number, number] = [37, 99, 235] // #2563eb
  const secondaryColor: [number, number, number] = [22, 163, 74] // #16a34a
  const textColor: [number, number, number] = [55, 65, 81] // #374151
  const lightGray: [number, number, number] = [243, 244, 246] // #f3f4f6

  let yPosition = 20

  // Header
  pdf.setFillColor(...primaryColor)
  pdf.rect(0, 0, pageWidth, 40, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('COTIZACION DE MUDANZA', pageWidth / 2, 15, { align: 'center' })
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Yo Me Encargo - Servicios de Mudanza', pageWidth / 2, 25, { align: 'center' })
  
  pdf.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, pageWidth / 2, 32, { align: 'center' })

  yPosition = 50

  // Informacion del Cliente
  pdf.setTextColor(...textColor)
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('INFORMACION DEL CLIENTE', 20, yPosition)
  
  yPosition += 10
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  
  if (personalInfo) {
    pdf.text(`Nombre: ${personalInfo.name}`, 20, yPosition)
    yPosition += 7
    pdf.text(`Email: ${personalInfo.email}`, 20, yPosition)
    yPosition += 7
    pdf.text(`Telefono: ${personalInfo.phone}`, 20, yPosition)
    yPosition += 7
    
    if (personalInfo.isCompany && personalInfo.companyName) {
      yPosition += 5
      // Cuadro de facturación con advertencia
      pdf.setFillColor(219, 234, 254) // bg-blue-100
      pdf.setDrawColor(220, 38, 38) // border-red-600
      pdf.setLineWidth(1.5)
      pdf.rect(20, yPosition - 3, pageWidth - 40, 35, 'FD')
      
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...primaryColor)
      pdf.setFontSize(12)
      pdf.text('CON FACTURA', 25, yPosition + 3)
      
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...textColor)
      yPosition += 8
      pdf.text(`Razon Social: ${personalInfo.companyName}`, 25, yPosition)
      yPosition += 6
      pdf.text(`RUT: ${personalInfo.companyRut || 'No especificado'}`, 25, yPosition)
      yPosition += 8
      
      // Advertencia dentro del mismo cuadro
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(220, 38, 38) // red-600
      pdf.setFontSize(10)
      pdf.text('ESTE DOCUMENTO NO ES VALIDO COMO FACTURA', pageWidth / 2, yPosition, { align: 'center' })
      
      pdf.setTextColor(...textColor)
      pdf.setFontSize(12)
      yPosition += 10
    }
  }

  yPosition += 5

  // Detalles de la Mudanza
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text('DETALLES DE LA MUDANZA', 20, yPosition)
  
  yPosition += 10
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  
  if (dateTime) {
    pdf.text(`Fecha: ${formatDate(new Date(dateTime))}`, 20, yPosition)
    yPosition += 7
    pdf.text(`Hora: ${formatTime(new Date(dateTime))}`, 20, yPosition)
    yPosition += 7
    
    if (isFlexible) {
      pdf.setTextColor(...secondaryColor)
      pdf.text('[OK] Con descuento por flexibilidad (10%)', 20, yPosition)
      pdf.setTextColor(...textColor)
      yPosition += 7
    }
  }

  yPosition += 10

  // Direcciones
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text('DIRECCIONES', 20, yPosition)
  
  yPosition += 8
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  
  if (origin.address) {
    pdf.text(`Origen: ${origin.address.street} ${origin.address.number}, ${origin.address.commune}`, 20, yPosition)
    yPosition += 7
    if (origin.details) {
      pdf.text(`Tipo: ${origin.details.propertyType} - Piso ${origin.details.floor}${origin.details.hasElevator ? ' (con ascensor)' : ' (sin ascensor)'}`, 20, yPosition)
      yPosition += 7
    }
  }
  
  if (destination.address) {
    pdf.text(`Destino: ${destination.address.street} ${destination.address.number}, ${destination.address.commune}`, 20, yPosition)
    yPosition += 7
    if (destination.details) {
      pdf.text(`Tipo: ${destination.details.propertyType} - Piso ${destination.details.floor}${destination.details.hasElevator ? ' (con ascensor)' : ' (sin ascensor)'}`, 20, yPosition)
      yPosition += 7
    }
  }

  yPosition += 10

  // Verificar si necesitamos una nueva página
  if (yPosition > 150) {
    pdf.addPage()
    yPosition = 20
  }

  // Items a Transportar
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text('ITEMS A TRANSPORTAR', 20, yPosition)
  
  yPosition += 10
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  
  // Tabla de items
  const tableTop = yPosition
  const itemHeight = 6
  const col1 = 20
  const col2 = 120
  const col3 = 160
  
  // Headers de la tabla
  pdf.setFont('helvetica', 'bold')
  pdf.text('Item', col1, yPosition)
  pdf.text('Cantidad', col2, yPosition)
  pdf.text('Volumen', col3, yPosition)
  yPosition += itemHeight
  
  // Línea separadora
  pdf.setDrawColor(200, 200, 200)
  pdf.line(col1, yPosition - 2, pageWidth - 20, yPosition - 2)
  
  // Items
  pdf.setFont('helvetica', 'normal')
  items.forEach((item) => {
    if (yPosition > pageHeight - 30) {
      pdf.addPage()
      yPosition = 20
    }
    
    pdf.text(item.name, col1, yPosition)
    pdf.text(`x${item.quantity}`, col2, yPosition)
    pdf.text(`${(item.volume * item.quantity).toFixed(2)} m³`, col3, yPosition)
    yPosition += itemHeight
  })

  yPosition += 10

  // Resumen de volumen
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Volumen Total: ${totalVolume.toFixed(2)} m³`, 20, yPosition)
  yPosition += 6
  pdf.text(`Peso Total: ${totalWeight} kg`, 20, yPosition)
  yPosition += 6
  pdf.text(`Vehículo Recomendado: ${recommendedVehicle}`, 20, yPosition)

  yPosition += 15

  // Servicios Adicionales
  const hasAdditionalServices = additionalServices.disassembly || 
    additionalServices.assembly || 
    additionalServices.packing || 
    additionalServices.unpacking

  if (hasAdditionalServices) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.text('SERVICIOS ADICIONALES', 20, yPosition)
    yPosition += 8
    
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    
    if (additionalServices.disassembly) {
      pdf.text('[OK] Desarme de muebles - $15.000', 20, yPosition)
      yPosition += 6
    }
    if (additionalServices.assembly) {
      pdf.text('[OK] Armado de muebles - $15.000', 20, yPosition)
      yPosition += 6
    }
    if (additionalServices.packing) {
      pdf.text('[OK] Embalaje profesional - $20.000', 20, yPosition)
      yPosition += 6
    }
    if (additionalServices.unpacking) {
      pdf.text('[OK] Desembalaje - $10.000', 20, yPosition)
      yPosition += 6
    }
    
    yPosition += 10
  }

  // Observaciones
  if (additionalServices.observations) {
    pdf.setFont('helvetica', 'bold')
    pdf.text('OBSERVACIONES:', 20, yPosition)
    yPosition += 8
    pdf.setFont('helvetica', 'normal')
    
    // Dividir texto largo en líneas
    const observations = pdf.splitTextToSize(additionalServices.observations, pageWidth - 40)
    observations.forEach((line: string) => {
      pdf.text(line, 20, yPosition)
      yPosition += 6
    })
    
    yPosition += 10
  }

  // Precio Final
  pdf.setFillColor(...lightGray)
  pdf.rect(20, yPosition, pageWidth - 40, 25, 'F')
  
  pdf.setTextColor(...primaryColor)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('PRECIO ESTIMADO', pageWidth / 2, yPosition + 10, { align: 'center' })
  
  pdf.setFontSize(28)
  pdf.text(formatCurrency(estimatedPrice), pageWidth / 2, yPosition + 20, { align: 'center' })
  
  pdf.setTextColor(...textColor)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('IVA incluido', pageWidth / 2, yPosition + 25, { align: 'center' })

  // Footer
  const footerY = pageHeight - 20
  pdf.setFontSize(8)
  pdf.setTextColor(128, 128, 128)
  
  if (personalInfo?.isCompany) {
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(220, 38, 38) // red-600
    pdf.setFontSize(9)
    pdf.text('NOTA: Este documento NO es valido como factura. La factura se emitira al momento del pago.', pageWidth / 2, footerY - 15, { align: 'center' })
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(128, 128, 128)
    pdf.setFontSize(8)
  }
  
  pdf.text('Esta cotizacion es valida por 7 dias desde la fecha de emision.', pageWidth / 2, footerY - 10, { align: 'center' })
  pdf.text('Para confirmar tu reserva, contactanos al +56 9 1234 5678', pageWidth / 2, footerY - 5, { align: 'center' })
  pdf.text('www.yomeencargo.cl | contacto@yomeencargo.cl', pageWidth / 2, footerY, { align: 'center' })

  // Descargar el PDF
  const fileName = `Cotizacion_Mudanza_${personalInfo?.name?.replace(/\s/g, '_') || 'Cliente'}_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}

export const generateQuotePDFFromData = (quoteData: any) => {
  // Función alternativa que recibe los datos como parámetro
  // Útil para generar PDFs desde el backend
  return generateQuotePDF()
}

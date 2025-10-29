-- ============================================
-- AGREGAR CAMPOS ADICIONALES A TABLA BOOKINGS
-- ============================================
-- Ejecutar en Supabase → SQL Editor
-- Este script agrega los nuevos campos SIN eliminar datos existentes

-- Agregar columna para tipo de pago
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50);

-- Agregar columna para precio completo
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS total_price INTEGER;

-- Agregar columna para dirección origen (una sola línea)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS origin_address TEXT;

-- Agregar columna para dirección destino (una sola línea)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS destination_address TEXT;

-- Verificar que las columnas fueron agregadas
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name IN ('payment_type', 'total_price', 'origin_address', 'destination_address')
ORDER BY column_name;

-- ============================================
-- ¡LISTO! Los nuevos campos están agregados
-- ============================================


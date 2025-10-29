-- ============================================
-- AGREGAR CAMPO ORIGINAL_PRICE A TABLA BOOKINGS
-- ============================================
-- Ejecutar en Supabase → SQL Editor
-- Este script agrega el campo para guardar el precio original (100%)

-- Agregar columna para precio original completo (100%)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS original_price INTEGER;

-- Verificar que la columna fue agregada
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name IN ('original_price', 'total_price', 'payment_type')
ORDER BY column_name;

-- ============================================
-- ¡LISTO! El nuevo campo está agregado
-- ============================================


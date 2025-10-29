-- ============================================
-- ELIMINAR CONSTRAINT UNIQUE DE BOOKINGS
-- ============================================
-- Este constraint impide tener múltiples reservas
-- en la misma fecha y hora (contradice la lógica del sistema)
-- Ejecutar en Supabase → SQL Editor

-- Eliminar el constraint UNIQUE problemático
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_scheduled_date_scheduled_time_key;

-- Verificar que se eliminó correctamente
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  a.attname as column_name
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
WHERE t.relname = 'bookings' 
  AND conname = 'bookings_scheduled_date_scheduled_time_key';

-- Debería no devolver ningún resultado

-- ============================================
-- ¡LISTO! Ahora puedes tener múltiples reservas
-- en la misma fecha y hora (según capacidad de flota)
-- ============================================


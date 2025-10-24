-- ============================================
-- SCRIPT PARA AGREGAR KILÓMETROS GRATIS
-- ============================================
-- Ejecutar este SQL en Supabase → SQL Editor

-- Agregar columna free_kilometers a la tabla pricing_config
ALTER TABLE pricing_config 
ADD COLUMN IF NOT EXISTS free_kilometers INT DEFAULT 50;

-- Actualizar registros existentes con el valor por defecto
UPDATE pricing_config 
SET free_kilometers = 50 
WHERE free_kilometers IS NULL;

-- ============================================
-- ¡LISTO! Los kilómetros gratis están configurados
-- ============================================

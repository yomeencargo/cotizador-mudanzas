-- ============================================
-- SCRIPT ALTERNATIVO - SOLO AGREGAR COLUMNA
-- ============================================
-- Si la tabla ya existe pero le falta la columna free_kilometers

-- Agregar la columna free_kilometers
ALTER TABLE pricing_config 
ADD COLUMN IF NOT EXISTS free_kilometers INT DEFAULT 50;

-- Actualizar registros existentes
UPDATE pricing_config 
SET free_kilometers = 50 
WHERE free_kilometers IS NULL;

-- Verificar que se agregó correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'pricing_config' 
AND column_name = 'free_kilometers';

-- ============================================
-- ¡LISTO! Columna agregada correctamente
-- ============================================

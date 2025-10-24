-- ============================================
-- SCRIPT DE DIAGNÓSTICO
-- ============================================
-- Ejecutar este SQL para ver el estado actual de la tabla

-- 1. Verificar si la tabla existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'pricing_config'
) AS tabla_existe;

-- 2. Ver todas las columnas de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pricing_config'
ORDER BY ordinal_position;

-- 3. Ver los datos actuales (si existen)
SELECT * FROM pricing_config LIMIT 1;

-- 4. Contar registros
SELECT COUNT(*) as total_registros FROM pricing_config;

-- ============================================
-- Este script te dirá exactamente qué está pasando
-- ============================================

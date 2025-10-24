-- ============================================
-- SCRIPT PARA LIMPIAR REGISTROS DUPLICADOS
-- ============================================
-- Ejecutar este SQL en Supabase → SQL Editor

-- 1. Ver cuántos registros hay
SELECT COUNT(*) as total_registros FROM pricing_config;

-- 2. Ver todos los registros
SELECT id, base_price, created_at FROM pricing_config ORDER BY created_at DESC;

-- 3. Eliminar registros duplicados (mantener solo el más reciente)
DELETE FROM pricing_config 
WHERE id NOT IN (
    SELECT id FROM (
        SELECT DISTINCT ON (base_price, price_per_cubic_meter, price_per_kilometer) 
        id, base_price, price_per_cubic_meter, price_per_kilometer, created_at
        FROM pricing_config 
        ORDER BY base_price, price_per_cubic_meter, price_per_kilometer, created_at DESC
    ) AS unique_records
);

-- 4. Si no quedó ningún registro, insertar uno nuevo
INSERT INTO pricing_config DEFAULT VALUES
ON CONFLICT DO NOTHING;

-- 5. Verificar que solo quede un registro
SELECT COUNT(*) as total_registros FROM pricing_config;

-- 6. Ver el registro final
SELECT 
    id,
    base_price,
    price_per_cubic_meter,
    price_per_kilometer,
    free_kilometers,
    floor_surcharge,
    additional_services,
    special_packaging,
    time_surcharges,
    discounts,
    created_at
FROM pricing_config
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- ¡LISTO! Solo queda un registro limpio
-- ============================================

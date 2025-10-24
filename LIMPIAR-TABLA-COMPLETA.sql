-- ============================================
-- SCRIPT SIMPLE - LIMPIAR Y EMPEZAR DE CERO
-- ============================================
-- Ejecutar este SQL en Supabase → SQL Editor

-- 1. Eliminar todos los registros existentes
DELETE FROM pricing_config;

-- 2. Insertar un solo registro limpio
INSERT INTO pricing_config (
  base_price,
  price_per_cubic_meter,
  price_per_kilometer,
  free_kilometers,
  floor_surcharge,
  additional_services,
  special_packaging,
  time_surcharges,
  discounts
) VALUES (
  50000,
  15000,
  800,
  50,
  5000,
  '{
    "packing": 25000,
    "unpacking": 20000,
    "disassembly": 15000,
    "assembly": 15000,
    "cleaning": 30000
  }',
  '{
    "fragile": 10000,
    "electronics": 15000,
    "artwork": 25000,
    "piano": 50000
  }',
  '{
    "saturday": 20,
    "sunday": 50,
    "holiday": 100
  }',
  '{
    "flexibility": 10,
    "advance_booking": 5,
    "repeat_customer": 15
  }'
);

-- 3. Verificar que solo hay un registro
SELECT COUNT(*) as total_registros FROM pricing_config;

-- 4. Ver el registro final
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
FROM pricing_config;

-- ============================================
-- ¡LISTO! Tabla limpia con un solo registro
-- ============================================

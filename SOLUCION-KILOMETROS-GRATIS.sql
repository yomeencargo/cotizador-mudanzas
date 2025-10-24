-- ============================================
-- SCRIPT COMPLETO PARA ARREGLAR KILÓMETROS GRATIS
-- ============================================
-- Ejecutar este SQL en Supabase → SQL Editor

-- 1. Verificar si la tabla existe y crear si no existe
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_price INT NOT NULL DEFAULT 50000,
  price_per_cubic_meter INT NOT NULL DEFAULT 15000,
  price_per_kilometer INT NOT NULL DEFAULT 800,
  free_kilometers INT NOT NULL DEFAULT 50,
  floor_surcharge INT NOT NULL DEFAULT 5000,
  additional_services JSONB NOT NULL DEFAULT '{
    "packing": 25000,
    "unpacking": 20000,
    "disassembly": 15000,
    "assembly": 15000,
    "cleaning": 30000
  }',
  special_packaging JSONB NOT NULL DEFAULT '{
    "fragile": 10000,
    "electronics": 15000,
    "artwork": 25000,
    "piano": 50000
  }',
  time_surcharges JSONB NOT NULL DEFAULT '{
    "saturday": 20,
    "sunday": 50,
    "holiday": 100
  }',
  discounts JSONB NOT NULL DEFAULT '{
    "flexibility": 10,
    "advance_booking": 5,
    "repeat_customer": 15
  }',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Agregar columna free_kilometers si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pricing_config' 
        AND column_name = 'free_kilometers'
    ) THEN
        ALTER TABLE pricing_config ADD COLUMN free_kilometers INT DEFAULT 50;
    END IF;
END $$;

-- 3. Actualizar registros existentes con el valor por defecto
UPDATE pricing_config 
SET free_kilometers = 50 
WHERE free_kilometers IS NULL;

-- 4. Insertar configuración inicial si no existe
INSERT INTO pricing_config DEFAULT VALUES
ON CONFLICT DO NOTHING;

-- 5. Verificar que todo esté correcto
SELECT 
    id,
    base_price,
    price_per_cubic_meter,
    price_per_kilometer,
    free_kilometers,
    floor_surcharge,
    created_at
FROM pricing_config
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- ¡LISTO! La tabla está completamente configurada
-- ============================================

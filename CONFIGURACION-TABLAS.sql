-- ============================================
-- SCRIPT PARA CREAR TABLAS DE CONFIGURACIÓN
-- ============================================
-- Ejecutar este SQL en Supabase → SQL Editor

-- Tabla para configuración de precios
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

-- Tabla para configuración de horarios
CREATE TABLE IF NOT EXISTS schedule_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  days_of_week JSONB NOT NULL DEFAULT '{
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": true,
    "sunday": false
  }',
  time_slots JSONB NOT NULL DEFAULT '[
    {"time": "08:00", "label": "08:00 hrs", "recommended": true},
    {"time": "09:00", "label": "09:00 hrs", "recommended": true},
    {"time": "10:00", "label": "10:00 hrs", "recommended": true},
    {"time": "11:00", "label": "11:00 hrs", "recommended": false},
    {"time": "14:00", "label": "14:00 hrs", "recommended": true},
    {"time": "15:00", "label": "15:00 hrs", "recommended": false}
  ]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar configuración inicial si no existe
INSERT INTO pricing_config DEFAULT VALUES
ON CONFLICT DO NOTHING;

INSERT INTO schedule_config DEFAULT VALUES
ON CONFLICT DO NOTHING;

-- ============================================
-- ¡LISTO! Las tablas están creadas
-- ============================================

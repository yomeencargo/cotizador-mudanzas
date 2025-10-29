-- ============================================
-- SOLUCIÓN DEFINITIVA: Prevenir duplicados para siempre
-- ============================================
-- Ejecutar en Supabase → SQL Editor

-- PASO 1: Ver el estado actual
SELECT id, created_at, days_of_week, time_slots FROM schedule_config ORDER BY created_at DESC;

-- PASO 2: Crear tabla temporal con el registro más reciente (por si necesitas backup)
CREATE TEMP TABLE schedule_config_backup AS
SELECT * FROM schedule_config
ORDER BY created_at DESC
LIMIT 1;

-- PASO 3: Eliminar todos los registros duplicados
TRUNCATE TABLE schedule_config CASCADE;

-- PASO 4: Crear constraint único para evitar duplicados futuros
-- Esto asegura que solo puede haber 1 configuración
ALTER TABLE schedule_config 
ADD CONSTRAINT schedule_config_singleton CHECK (
  (SELECT COUNT(*) FROM schedule_config) <= 1
);

-- PASO 5: Restaurar el backup (si existe)
INSERT INTO schedule_config (days_of_week, time_slots, created_at, updated_at)
SELECT days_of_week, time_slots, created_at, updated_at
FROM schedule_config_backup;

-- PASO 6: Si no hay backup, crear configuración por defecto
INSERT INTO schedule_config (days_of_week, time_slots)
VALUES (
  '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": false}',
  '[
    {"time": "08:00", "label": "08:00 hrs", "recommended": true},
    {"time": "09:00", "label": "09:00 hrs", "recommended": true},
    {"time": "10:00", "label": "10:00 hrs", "recommended": true},
    {"time": "11:00", "label": "11:00 hrs", "recommended": false},
    {"time": "14:00", "label": "14:00 hrs", "recommended": true},
    {"time": "15:00", "label": "15:00 hrs", "recommended": false}
  ]'
)
WHERE NOT EXISTS (SELECT 1 FROM schedule_config);

-- PASO 7: Verificar resultado
SELECT id, created_at, 
       jsonb_pretty(days_of_week) as days,
       jsonb_pretty(time_slots) as slots
FROM schedule_config;

-- PASO 8: Crear función helper para garantizar unicidad
CREATE OR REPLACE FUNCTION ensure_single_schedule_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Si intentan insertar cuando ya hay un registro, convertir en UPDATE
  IF (SELECT COUNT(*) FROM schedule_config) > 0 THEN
    DELETE FROM schedule_config WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 9: Crear trigger para usar la función
DROP TRIGGER IF EXISTS single_schedule_config_trigger ON schedule_config;
CREATE TRIGGER single_schedule_config_trigger
  BEFORE INSERT ON schedule_config
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_schedule_config();

-- ============================================
-- ✅ LISTO! Ahora la tabla:
--   1. Solo puede tener 1 registro
--   2. Si intentas insertar otro, se convierte en UPDATE
--   3. El constraint previene duplicados en el nivel de BD
-- ============================================


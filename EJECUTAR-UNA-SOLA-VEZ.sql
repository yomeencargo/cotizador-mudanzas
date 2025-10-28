-- ============================================
-- 🚨 IMPORTANTE: Ejecutar SOLO UNA VEZ
-- ============================================
-- Este SQL crea las protecciones para que NUNCA
-- vuelva a haber duplicados en schedule_config
-- ============================================

-- PASO 1: Ver estado actual
SELECT 'Registros actuales:' as info;
SELECT id, created_at FROM schedule_config ORDER BY created_at DESC;

-- PASO 2: Crear backup temporal del más reciente
CREATE TEMP TABLE schedule_config_backup AS
SELECT * FROM schedule_config
ORDER BY created_at DESC
LIMIT 1;

-- PASO 3: Limpiar duplicados
TRUNCATE TABLE schedule_config CASCADE;

-- PASO 4: Crear función que garantiza solo 1 registro
CREATE OR REPLACE FUNCTION ensure_single_schedule_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminar cualquier registro anterior, manteniendo solo este
  DELETE FROM schedule_config WHERE id != NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 5: Crear trigger
DROP TRIGGER IF EXISTS single_schedule_config_trigger ON schedule_config;
CREATE TRIGGER single_schedule_config_trigger
  BEFORE INSERT ON schedule_config
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_schedule_config();

-- PASO 6: Restaurar backup o crear nuevo
INSERT INTO schedule_config (days_of_week, time_slots, created_at, updated_at)
SELECT days_of_week, time_slots, created_at, updated_at
FROM schedule_config_backup
ON CONFLICT DO NOTHING;

-- Si no había backup, crear configuración por defecto
INSERT INTO schedule_config (days_of_week, time_slots)
SELECT
  '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": false}'::jsonb,
  '[
    {"time": "08:00", "label": "08:00 hrs", "recommended": true},
    {"time": "09:00", "label": "09:00 hrs", "recommended": true},
    {"time": "10:00", "label": "10:00 hrs", "recommended": true},
    {"time": "11:00", "label": "11:00 hrs", "recommended": false},
    {"time": "14:00", "label": "14:00 hrs", "recommended": true},
    {"time": "15:00", "label": "15:00 hrs", "recommended": false}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM schedule_config);

-- PASO 7: Verificar resultado
SELECT '✅ Configuración final:' as info;
SELECT id, created_at, 
       jsonb_pretty(days_of_week) as dias,
       jsonb_pretty(time_slots) as horarios
FROM schedule_config;

-- ============================================
-- ✅ LISTO! Protecciones instaladas:
--   1. El trigger elimina duplicados automáticamente
--   2. Siempre habrá máximo 1 registro
--   3. No volverá a haber este problema
-- ============================================


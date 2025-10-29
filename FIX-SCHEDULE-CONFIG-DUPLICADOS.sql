-- ============================================
-- SOLUCIONAR PROBLEMA DE DUPLICADOS
-- ============================================
-- Ejecutar este SQL en Supabase → SQL Editor

-- Ver cuántos registros hay
SELECT id, created_at FROM schedule_config ORDER BY created_at DESC;

-- ELIMINAR DUPLICADOS (mantener solo el más reciente)
DELETE FROM schedule_config
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY 1 ORDER BY created_at DESC) as rn
    FROM schedule_config
  ) t
  WHERE rn = 1
);

-- Si esto no funciona, eliminar todos y dejar que se cree uno nuevo automáticamente
-- DELETE FROM schedule_config;

-- Verificar resultado
SELECT id, created_at FROM schedule_config;


-- ============================================
-- SOLUCIÓN RÁPIDA: Eliminar duplicados
-- ============================================
-- Ejecutar en Supabase → SQL Editor

-- PASO 1: Ver cuántos registros hay
SELECT id, created_at FROM schedule_config ORDER BY created_at DESC;

-- PASO 2: Eliminar TODOS los registros antiguos (guardar solo el más reciente)
-- O mejor aún: eliminar todos para que se cree uno limpio
DELETE FROM schedule_config;

-- PASO 3: Verificar que está vacío
SELECT * FROM schedule_config;

-- ✅ LISTO! Ahora cuando guardes la configuración desde el admin
-- se creará automáticamente un nuevo registro limpio

-- ============================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ============================================
-- 1. Ejecuta este SQL
-- 2. Refresca la página del admin (Ctrl + F5)
-- 3. Ve a Configuración → Horarios
-- 4. Guarda la configuración (se creará el registro limpio)
-- 5. ¡Listo!


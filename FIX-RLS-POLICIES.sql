-- ============================================
-- FIX: Políticas RLS para permitir acceso a datos
-- ============================================
-- Ejecutar este SQL en Supabase → SQL Editor

-- Deshabilitar RLS temporalmente (SOLO PARA DESARROLLO)
-- En producción, deberías usar políticas específicas en su lugar

-- Deshabilitar RLS para bookings
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS para blocked_slots
ALTER TABLE blocked_slots DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS para fleet_config
ALTER TABLE fleet_config DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS para pricing_config
ALTER TABLE pricing_config DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS para schedule_config
ALTER TABLE schedule_config DISABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTA IMPORTANTE:
-- ============================================
-- Esta solución desactiva completamente RLS.
-- Es adecuada si TU API maneja toda la autenticación/autorización.
-- 
-- Si necesitas mantener RLS activo para mayor seguridad,
-- ejecuta el siguiente script en su lugar (FIX-RLS-POLICIES-SECURE.sql)


-- ============================================
-- FIX: Desactivar RLS para permitir acceso a reservas
-- ============================================
-- Este script desactiva RLS en todas las tablas críticas
-- Ejecutar en Supabase → SQL Editor

-- Desactivar RLS en bookings (reservas)
ALTER TABLE IF EXISTS bookings DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS en blocked_slots (horarios bloqueados)
ALTER TABLE IF EXISTS blocked_slots DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS en fleet_config (configuración de flota)
ALTER TABLE IF EXISTS fleet_config DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS en pricing_config (configuración de precios)
ALTER TABLE IF EXISTS pricing_config DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS en schedule_config (configuración de horarios)
ALTER TABLE IF EXISTS schedule_config DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS en catalog_items (catálogo de items)
ALTER TABLE IF EXISTS catalog_items DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está desactivado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('bookings', 'blocked_slots', 'fleet_config', 'pricing_config', 'schedule_config', 'catalog_items');

-- ============================================
-- ¡LISTO! RLS está desactivado
-- Ahora deberías poder ver las reservas en producción
-- ============================================


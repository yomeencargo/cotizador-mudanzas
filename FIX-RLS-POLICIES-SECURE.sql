-- ============================================
-- FIX: Políticas RLS seguras para permitir acceso
-- ============================================
-- Ejecutar este SQL en Supabase → SQL Editor
-- (Para mantener RLS habilitado con políticas)

-- Habilitar RLS para todas las tablas
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_config ENABLE ROW LEVEL SECURITY;

-- Crear políticas para bookings
-- Permitir SELECT a todos (para admin usando service_role_key)
CREATE POLICY "Allow all for service_role_key" ON bookings
  FOR ALL USING (true);

-- Permitir INSERT a todos (para public bookings)
CREATE POLICY "Allow public insert" ON bookings
  FOR INSERT WITH CHECK (true);

-- Crear políticas para blocked_slots
CREATE POLICY "Allow all for service_role_key" ON blocked_slots
  FOR ALL USING (true);

-- Crear políticas para fleet_config
CREATE POLICY "Allow all for service_role_key" ON fleet_config
  FOR ALL USING (true);

-- Crear políticas para pricing_config
CREATE POLICY "Allow all for service_role_key" ON pricing_config
  FOR ALL USING (true);

-- Crear políticas para schedule_config
CREATE POLICY "Allow all for service_role_key" ON schedule_config
  FOR ALL USING (true);

-- ============================================
-- ¡LISTO! RLS está habilitado con políticas seguras
-- ============================================


-- ============================================
-- ELIMINAR CAMPO CLEANING DE PRICING_CONFIG
-- ============================================
-- Este script elimina el campo 'cleaning' de la configuración de precios
-- ya que no se usa en la página web

-- Actualizar los registros existentes eliminando el campo cleaning
UPDATE pricing_config 
SET additional_services = additional_services - 'cleaning'
WHERE additional_services ? 'cleaning';

-- Verificar que se eliminó correctamente
SELECT 
  id,
  additional_services,
  created_at 
FROM pricing_config 
ORDER BY created_at DESC 
LIMIT 1;

-- Mostrar mensaje de confirmación
SELECT 'Campo cleaning eliminado correctamente de pricing_config' AS resultado;

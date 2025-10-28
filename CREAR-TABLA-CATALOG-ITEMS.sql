-- ============================================
-- TABLA PARA GESTIÓN DE ITEMS DEL CATÁLOGO
-- ============================================
-- Ejecutar este SQL en Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  volume DECIMAL(10, 4) NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  is_fragile BOOLEAN DEFAULT FALSE,
  is_heavy BOOLEAN DEFAULT FALSE,
  is_glass BOOLEAN DEFAULT FALSE,
  image VARCHAR(10) DEFAULT '📦',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON catalog_items(category);
CREATE INDEX IF NOT EXISTS idx_catalog_items_active ON catalog_items(is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_items_order ON catalog_items(display_order);

-- Insertar items iniciales desde el catálogo actual
INSERT INTO catalog_items (name, category, volume, weight, is_fragile, is_heavy, is_glass, image, display_order) VALUES
-- Muebles de Sala
('Sofá 3 cuerpos', 'Sala', 2.5, 80, FALSE, TRUE, FALSE, '🛋️', 1),
('Sofá 2 cuerpos', 'Sala', 2.0, 60, FALSE, TRUE, FALSE, '🛋️', 2),
('Sillón', 'Sala', 1.2, 35, FALSE, FALSE, FALSE, '🪑', 3),
('Mesa de Centro', 'Sala', 0.5, 25, FALSE, FALSE, TRUE, '🪑', 4),
('Estante/Biblioteca', 'Sala', 1.8, 50, FALSE, TRUE, FALSE, '📚', 5),
('TV Grande (>50")', 'Sala', 0.3, 15, TRUE, FALSE, TRUE, '📺', 6),
('TV Mediano (32-50")', 'Sala', 0.2, 10, TRUE, FALSE, TRUE, '📺', 7),

-- Muebles de Comedor
('Mesa Comedor 6 personas', 'Comedor', 1.5, 60, FALSE, TRUE, FALSE, '🍽️', 11),
('Mesa Comedor 4 personas', 'Comedor', 1.0, 40, FALSE, FALSE, FALSE, '🍽️', 12),
('Silla de Comedor', 'Comedor', 0.3, 8, FALSE, FALSE, FALSE, '🪑', 13),
('Vitrina/Vajillero', 'Comedor', 1.2, 50, TRUE, TRUE, TRUE, '🗄️', 14),

-- Muebles de Dormitorio
('Cama 2 Plazas', 'Dormitorio', 2.0, 70, FALSE, TRUE, FALSE, '🛏️', 21),
('Cama 1.5 Plazas', 'Dormitorio', 1.5, 50, FALSE, TRUE, FALSE, '🛏️', 22),
('Cama 1 Plaza', 'Dormitorio', 1.2, 35, FALSE, FALSE, FALSE, '🛏️', 23),
('Colchón 2 Plazas', 'Dormitorio', 1.5, 30, FALSE, FALSE, FALSE, '🛏️', 24),
('Colchón 1 Plaza', 'Dormitorio', 0.8, 20, FALSE, FALSE, FALSE, '🛏️', 25),
('Velador/Mesa de Noche', 'Dormitorio', 0.3, 15, FALSE, FALSE, FALSE, '🪑', 26),
('Cómoda', 'Dormitorio', 1.0, 40, FALSE, FALSE, FALSE, '🗄️', 27),
('Ropero Grande (3 cuerpos)', 'Dormitorio', 3.5, 100, FALSE, TRUE, FALSE, '🚪', 28),
('Ropero Mediano (2 cuerpos)', 'Dormitorio', 2.5, 70, FALSE, TRUE, FALSE, '🚪', 29),

-- Electrodomésticos
('Refrigerador', 'Electrodomésticos', 2.0, 80, TRUE, TRUE, FALSE, '🧊', 31),
('Lavadora', 'Electrodomésticos', 1.2, 70, TRUE, TRUE, FALSE, '🧺', 32),
('Secadora', 'Electrodomésticos', 1.2, 60, TRUE, TRUE, FALSE, '🧺', 33),
('Microondas', 'Electrodomésticos', 0.2, 15, TRUE, FALSE, TRUE, '📻', 34),
('Horno Eléctrico', 'Electrodomésticos', 0.3, 20, TRUE, FALSE, TRUE, '🔥', 35),

-- Oficina
('Escritorio', 'Oficina', 1.2, 40, FALSE, FALSE, FALSE, '🖥️', 41),
('Silla de Oficina', 'Oficina', 0.5, 15, FALSE, FALSE, FALSE, '🪑', 42),
('Archivador', 'Oficina', 0.8, 30, FALSE, FALSE, FALSE, '🗄️', 43),

-- Otros
('Caja de Libros', 'Otros', 0.1, 20, FALSE, TRUE, FALSE, '📦', 51),
('Caja Mediana', 'Otros', 0.1, 10, FALSE, FALSE, FALSE, '📦', 52),
('Caja de Ropa', 'Otros', 0.2, 15, FALSE, FALSE, FALSE, '📦', 53),
('Bicicleta', 'Otros', 0.5, 15, FALSE, FALSE, FALSE, '🚲', 54);

-- Desactivar RLS por ahora (se puede activar luego si necesitas control de acceso)
-- ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;

-- Política para permitir todo el acceso (para simplificar)
-- Si necesitas restringir acceso, descomenta las líneas de arriba y crea las políticas

-- ============================================
-- ¡LISTO! La tabla está creada con datos iniciales
-- ============================================
-- Nota: Ajusta las políticas RLS según tu configuración de autenticación


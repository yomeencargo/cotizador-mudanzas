-- ============================================
-- SCHEMA DE BASE DE DATOS PARA SUPABASE
-- ============================================
-- Copiar y ejecutar este SQL en Supabase → SQL Editor

-- Tabla de configuración de flota
CREATE TABLE fleet_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  num_vehicles INT DEFAULT 1,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para configuración de precios
CREATE TABLE pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_price INT NOT NULL DEFAULT 50000,
  price_per_cubic_meter INT NOT NULL DEFAULT 15000,
  price_per_kilometer INT NOT NULL DEFAULT 800,
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
CREATE TABLE schedule_config (
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

-- Tabla de bloques de no disponibilidad
CREATE TABLE blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason VARCHAR(255),
  google_event_id VARCHAR(255),
  sync_from_calendar BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, start_time, end_time)
);

-- Tabla de reservas
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id VARCHAR(255) NOT NULL,
  
  -- Info del cliente
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  
  -- Mudanza
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_hours INT DEFAULT 4,
  
  -- Estado
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  
  -- Vehículo asignado
  assigned_vehicle_id INT,
  
  -- Integraciones
  google_calendar_event_id VARCHAR(255),
  drive_file_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  UNIQUE(scheduled_date, scheduled_time)
);

-- Crear índices para mejor performance
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_time ON bookings(scheduled_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_blocked_date ON blocked_slots(date);

-- Insertar configuración inicial (1 camión por defecto)
INSERT INTO fleet_config (num_vehicles) VALUES (1);

-- Configuración inicial de precios
INSERT INTO pricing_config DEFAULT VALUES;

-- Configuración inicial de horarios
INSERT INTO schedule_config DEFAULT VALUES;

-- ============================================
-- LISTO! Ya puedes usar la BD
-- ============================================

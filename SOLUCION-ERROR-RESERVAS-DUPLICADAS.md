# 🔧 SOLUCIÓN: Error "duplicate key value violates unique constraint"

## 🐛 El Problema

Cuando intentas crear una reserva, recibes este error:

```
Error creating booking: {
  code: '23505',
  details: 'Key (scheduled_date, scheduled_time)=(2025-10-29, 09:00:00) already exists.',
  hint: null,
  message: 'duplicate key value violates unique constraint "bookings_scheduled_date_scheduled_time_key"'
}
```

## 🔍 Causa

En tu base de datos hay un **constraint UNIQUE** en los campos `scheduled_date` y `scheduled_time` que impide tener más de una reserva con la misma fecha y hora.

### ¿Por qué es un problema?

Tu sistema ya maneja múltiples reservas inteligentemente:
- Verifica la cantidad de vehículos disponibles (`fleet_config.num_vehicles`)
- Cuenta las reservas activas en ese horario
- Permite crear reservas hasta agotar la capacidad

**Ejemplo:**
- Si tienes 3 vehículos (`num_vehicles = 3`)
- Puedes tener hasta 3 reservas en el mismo horario
- Pero el constraint UNIQUE lo impide

## ✅ Solución

### PASO 1: Ejecutar SQL en Supabase (2 minutos)

1. Ve a **https://app.supabase.com**
2. Selecciona tu proyecto
3. Click en **SQL Editor** (menú izquierdo)
4. Click en **New Query**
5. Abre el archivo **`ELIMINAR-CONSTRAINT-UNIQUE-BOOKINGS.sql`**
6. **Copia TODO el contenido**
7. Pégalo en el editor de Supabase
8. Click en **Run** o presiona `Ctrl + Enter`

✅ Debe decir "Success"

### PASO 2: Probar de Nuevo

1. Completa una nueva cotización
2. Elige cualquier fecha/hora disponible
3. Confirma la reserva
4. ✅ Ahora debería funcionar

---

## 🎯 ¿Qué Hace el Sistema Ahora?

### Validación de Capacidad (Ya Implementada)

El código en `src/app/api/bookings/create/route.ts` verifica:

```typescript
// Obtiene cantidad de vehículos
const capacity = configData.num_vehicles

// Cuenta reservas activas en ese horario
const bookingCount = await supabase
  .from('bookings')
  .count()
  .eq('scheduled_date', date)
  .eq('scheduled_time', time)
  .in('status', ['confirmed', 'pending'])

// Calcula disponibilidad
const availableSlots = capacity - bookingCount

// Solo crea la reserva si hay espacio disponible
if (availableSlots <= 0) {
  return error('No hay disponibilidad')
}
```

### Ejemplo Práctico

**Configuración:**
- Vehículos disponibles: 3
- Horario elegido: 29/10/2025 a las 09:00

**Escenario 1: Sin reservas**
- Reservas existentes: 0
- Espacios disponibles: 3 - 0 = **3 disponibles**
- ✅ Permite crear 3 reservas

**Escenario 2: Ya hay 2 reservas**
- Reservas existentes: 2
- Espacios disponibles: 3 - 2 = **1 disponible**
- ✅ Permite crear 1 reserva más

**Escenario 3: Ya hay 3 reservas**
- Reservas existentes: 3
- Espacios disponibles: 3 - 3 = **0 disponibles**
- ❌ Bloquea crear más reservas (calendario lo marca como "no disponible")

---

## ⚠️ IMPORTANTE

### Después de Eliminar el Constraint:

✅ **Funciones Correctamente:**
- Puedes tener múltiples reservas en mismo horario (según capacidad)
- El calendario muestra correctamente cuántos espacios quedan
- No permite sobre-reservar (protege la capacidad)

❌ **No Significa:**
- Que puedas crear reservas infinitas
- Que el sistema no valide disponibilidad
- Que se puedan duplicar reservas ilimitadamente

### La Protección Continúa:

El sistema sigue protegiendo la capacidad:
- Cuenta reservas activas
- Verifica si hay vehículos disponibles
- Bloquea horarios cuando se agotan
- El calendario muestra correctamente los espacios

---

## 📊 Comparación

| Aspecto | Con Constraint | Sin Constraint |
|--------|---------------|----------------|
| Permite múltiples reservas | ❌ No | ✅ Sí (según capacidad) |
| Protege contra sobre-reservas | ❌ No (bloquea todo) | ✅ Sí (valida capacidad) |
| Calendario funciona | ❌ No (muestra disponible pero falla) | ✅ Sí |
| Lógica del sistema | ❌ Contradice | ✅ Consistente |

---

## 🎯 Resultado Esperado

Después de aplicar la solución:

1. ✅ Puedes crear múltiples reservas en mismo horario
2. ✅ El sistema valida que haya capacidad disponible
3. ✅ El calendario muestra correctamente la disponibilidad
4. ✅ No puedes sobre-reservar la capacidad
5. ✅ Todo funciona como esperabas

---

## 🐛 Si Aún Tienes Problemas

### Verifica la Configuración de Flota

En Supabase SQL Editor:

```sql
SELECT * FROM fleet_config;
```

Debe mostrar:
- `num_vehicles`: Un número (ej: 1, 2, 3)
- Si no existe, ejecuta:
  ```sql
  INSERT INTO fleet_config (num_vehicles) VALUES (3);
  ```

### Verifica Reservas Activas

```sql
SELECT 
  scheduled_date, 
  scheduled_time, 
  COUNT(*) as cantidad
FROM bookings
WHERE status IN ('pending', 'confirmed')
GROUP BY scheduled_date, scheduled_time
ORDER BY scheduled_date, scheduled_time;
```

Esto muestra cuántas reservas hay en cada horario.

---

## ✅ LISTO

Después de ejecutar el SQL:
- El constraint problemático se elimina
- El sistema funcionará correctamente
- Podrás crear reservas según la capacidad real
- El calendario mostrará la disponibilidad correctamente


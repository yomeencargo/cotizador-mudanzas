# 📋 INSTRUCCIONES: Mostrar Precio Completo y Cambiar Estado de Pago

## ✅ CAMBIOS REALIZADOS

### 1. Campo `original_price` en Base de Datos
- Se agregó el campo `original_price` a la tabla `bookings`
- Este campo guarda el precio completo al 100% (aunque se haya pagado solo la mitad)

### 2. Columna PRECIO en Panel Admin
- Ahora muestra el precio completo (100%) en lugar del precio pagado
- Si está pagado a "mitad", muestra un badge indicando cuánto se pagó
- Formato: `$100.000` (precio completo)
  - Badge adicional: `Pagado: $50.000 (mitad)` (si aplica)

### 3. Botón para Cambiar Estado
- Agregado botón "✓ Marcar completo" en la columna ACCIONES
- Solo aparece cuando `payment_type = 'mitad'`
- Permite cambiar el estado de pago de "mitad" a "completo"
- Incluye confirmación antes de cambiar

### 4. Modal de Detalles
- Actualizado para mostrar el precio completo
- Muestra cuánto se pagó si está en "mitad"

---

## 🚀 PASOS PARA APLICAR

### PASO 1: Ejecutar SQL en Supabase

1. Ve a **https://app.supabase.com**
2. Selecciona tu proyecto
3. Click en **SQL Editor** (menú izquierdo)
4. Click en **New Query**
5. Abre el archivo **`AGREGAR-CAMPO-ORIGINAL-PRICE.sql`**
6. **Copia TODO el contenido**
7. Pégalo en el editor de Supabase
8. Click en **Run** o presiona `Ctrl + Enter`

✅ Debe decir "Success"

---

### PASO 2: Verificar Cambios

Las nuevas reservas guardarán el precio original completo.

**Ejemplo:**
- Precio estimado: $100.000
- Cliente elige "mitad" → se guarda:
  - `original_price`: 100000 (precio completo)
  - `total_price`: 50000 (precio pagado)
  - `payment_type`: "mitad"

---

## 📊 FUNCIONALIDAD EN PANEL ADMIN

### Columna PRECIO (100%):
```
$100.000
Pagado: $50.000 (mitad)  [badge amarillo]
```

### Botón "✓ Marcar completo":
- Aparece solo cuando `payment_type = 'mitad'`
- Ubicado en columna ACCIONES
- Al hacer clic:
  1. Confirma: "¿Cambiar el estado de pago de 'mitad' a 'completo'?"
  2. Actualiza `payment_type` a "completo"
  3. El botón desaparece (ya no está en "mitad")
  4. El badge amarillo desaparece

---

## 🔍 VERIFICAR QUE FUNCIONÓ

### En Supabase:
```sql
SELECT 
  client_name,
  payment_type,
  original_price,
  total_price,
  scheduled_date
FROM bookings
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:**
- `original_price`: Número (precio completo al 100%)
- `total_price`: Número (precio pagado)
- `payment_type`: "completo" o "mitad"

---

## 📝 ARCHIVOS MODIFICADOS

### 1. `AGREGAR-CAMPO-ORIGINAL-PRICE.sql` (NUEVO)
- Script SQL para agregar el campo `original_price`

### 2. `src/app/api/bookings/create/route.ts`
- Acepta y guarda el campo `original_price`

### 3. `src/components/steps/SummaryStep.tsx`
- Envía el campo `original_price` al crear reserva
- Usa `estimatedPrice` como precio original

### 4. `src/app/api/admin/bookings/route.ts`
- Trae el campo `original_price` en las consultas

### 5. `src/app/api/admin/bookings/[id]/route.ts`
- Permite actualizar el campo `payment_type`

### 6. `src/components/admin/BookingsManagement.tsx`
- Agregado campo `original_price` a la interfaz
- Función `updatePaymentType()` para cambiar estado
- Mostrar precio completo en columna PRECIO
- Badge indicando si está pagado a mitad
- Botón "✓ Marcar completo" en columna ACCIONES
- Modal actualizado para mostrar precio completo

---

## ⚠️ IMPORTANTE

### Para Reservas Antigas:
- No tienen `original_price` (no existía antes)
- Se mostrará el `total_price` como precio
- No se verá el badge amarillo
- El botón "✓ Marcar completo" NO aparecerá

### Solo las Nuevas Reservas:
- Tendrán `original_price` completo
- Mostrarán el badge si están en "mitad"
- Tendrán el botón de cambio

---

## 🎯 USO PARA ADMINISTRACIÓN

### Llevar Cuentas:
- **Columna PRECIO**: Siempre muestra el precio completo (100%)
- **Badge amarillo**: Indica si solo se pagó la mitad
- **Botón verde**: Permite marcar como "completo" cuando se reciba el pago restante

### Ejemplo de Flujo:
1. Cliente paga mitad → Aparece badge y botón
2. Admin ve precio completo en columna PRECIO
3. Admin hace clic en "✓ Marcar completo"
4. Confirma el cambio
5. Badge y botón desaparecen
6. Estado queda en "completo"

---

## 🐛 SI ALGO SALE MAL

### El campo `original_price` no existe:
→ Ejecutar el SQL nuevamente en Supabase

### No aparece el botón "✓ Marcar completo":
→ Verificar que `payment_type = 'mitad'`
→ Verificar que la reserva tenga `original_price`

### El precio se muestra como $0 o error:
→ Verificar que las nuevas reservas envíen `original_price`
→ Revisar console del navegador

---

## ✅ LISTO

Después de ejecutar el SQL y desplegar:
- Nuevas reservas guardarán el precio completo
- Panel admin mostrará el precio al 100%
- Badge indicará si está pagado a mitad
- Botón permitirá cambiar a completo


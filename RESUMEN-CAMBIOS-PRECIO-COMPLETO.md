# ✅ RESUMEN: Mostrar Precio Completo en Panel Admin

## 📌 Problema Resuelto
- La columna PRECIO ahora muestra el precio completo (100%) aunque se haya pagado solo la mitad
- Agregado botón "✓ Marcar completo" para cambiar el estado de pago de "mitad" a "completo"

---

## 🔄 Cambios Realizados

### 1. Base de Datos
- **Archivo**: `AGREGAR-CAMPO-ORIGINAL-PRICE.sql`
- **Campo nuevo**: `original_price` (INTEGER)
- Guarda el precio completo al 100%

### 2. API de Creación
- **Archivo**: `src/app/api/bookings/create/route.ts`
- Acepta y guarda `original_price`

### 3. Checkout/Creación de Reserva
- **Archivo**: `src/components/steps/SummaryStep.tsx`
- Envía `original_price` al crear reserva
- Usa `estimatedPrice` como precio original

### 4. API de Admin (GET)
- **Archivo**: `src/app/api/admin/bookings/route.ts`
- Trae el campo `original_price` en las consultas

### 5. API de Admin (PATCH)
- **Archivo**: `src/app/api/admin/bookings/[id]/route.ts`
- Permite actualizar el campo `payment_type`

### 6. Panel Admin - Interface
- **Archivo**: `src/components/admin/BookingsManagement.tsx`
- Agregado campo `original_price` a la interfaz Booking
- Nueva función `updatePaymentType()` para cambiar estado

### 7. Panel Admin - Visualización
- **Columna PRECIO**: Muestra el precio completo (original_price)
- **Badge amarillo**: Indica "Pagado: $X (mitad)" cuando aplica
- **Botón "✓ Marcar completo"**: En columna ACCIONES (solo para pagos a mitad)
- **Modal de detalles**: Muestra precio completo con info del pago

---

## 🎨 Cómo Se Ve Ahora

### Tabla en Panel Admin:

**Columna PRECIO:**
```
$100.000
Pagado: $50.000 (mitad)  ← badge amarillo
```

**Columna ACCIONES:**
```
[👁️] [✏️]  ← Botones normales
[✓ Marcar completo]  ← Botón verde (solo si pagó mitad)
```

---

## 🚀 Pasos Para Aplicar

1. **Ejecutar SQL en Supabase:**
   - Abrir `AGREGAR-CAMPO-ORIGINAL-PRICE.sql`
   - Copiar contenido
   - Pego en Supabase SQL Editor
   - Ejecutar (Ctrl + Enter)

2. **Desplegar a Producción:**
   ```bash
   git add .
   git commit -m "Add original_price and payment status update"
   git push
   ```

3. **Verificar:**
   - Completar una nueva reserva
   - Ir a admin → Reservas
   - Verificar que:
     - Precio completo se muestra en columna PRECIO
     - Badge amarillo aparece si pagó mitad
     - Botón "✓ Marcar completo" aparece

---

## 📊 Ejemplo de Datos

### Reserva Nueva (pago a mitad):
```json
{
  "client_name": "Juan Pérez",
  "original_price": 100000,
  "total_price": 50000,
  "payment_type": "mitad"
}
```

**En la tabla:**
- Precio mostrado: **$100.000** (original)
- Badge: "Pagado: $50.000 (mitad)"
- Botón: "✓ Marcar completo" visible

### Después de clickear botón:
```json
{
  "client_name": "Juan Pérez",
  "original_price": 100000,
  "total_price": 50000,
  "payment_type": "completo"  ← cambiado
}
```

**En la tabla:**
- Precio mostrado: **$100.000** (original)
- Badge: ❌ desaparece
- Botón: ❌ desaparece

---

## ✅ Listo Para Usar

- Nuevas reservas guardarán el precio completo
- Admin verá el precio al 100% siempre
- Badge indica si está pagado a mitad
- Botón permite cambiar a completo con un clic


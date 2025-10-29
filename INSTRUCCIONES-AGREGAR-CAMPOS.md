# 📋 INSTRUCCIONES: Agregar Campos Adicionales a Reservas

## ✅ LO QUE SE AGREGÓ (Sin tocar nada más)

### Campos nuevos en la base de datos:
1. **payment_type** - Indica si el cliente pagó "completo" o "mitad"
2. **total_price** - Precio total de la reserva
3. **origin_address** - Dirección origen completa en una línea
4. **destination_address** - Dirección destino completa en una línea

---

## 🚀 PASOS A SEGUIR

### PASO 1: Ejecutar SQL en Supabase (2 minutos)

1. Ve a **https://app.supabase.com**
2. Selecciona tu proyecto
3. Click en **SQL Editor** (menú izquierdo)
4. Click en **New Query**
5. Abre el archivo **`AGREGAR-CAMPOS-BOOKINGS.sql`**
6. **Copia TODO el contenido**
7. Pégalo en el editor de Supabase
8. Click en **Run** o presiona `Ctrl + Enter`

✅ Debe decir "Success"

**Eso agrega las columnas nuevas sin modificar datos existentes.**

---

### PASO 2: Probar Localmente (Opcional)

Si quieres probar antes de desplegar:

```bash
npm run dev
```

1. Completa una cotización de prueba
2. Confirma una reserva (elige cualquier opción de pago)
3. Ve a tu admin → Reservas
4. Verifica que aparezcan los nuevos campos

---

### PASO 3: Desplegar a Producción

```bash
git add .
git commit -m "Add payment_type, total_price, and address fields to bookings"
git push
```

Vercel desplegará automáticamente.

---

## 🔍 VERIFICAR QUE FUNCIONÓ

### En Supabase:

```sql
SELECT 
  client_name,
  payment_type,
  total_price,
  origin_address,
  destination_address,
  scheduled_date
FROM bookings
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:**
- `payment_type`: "completo" o "mitad"
- `total_price`: número (precio en pesos)
- `origin_address`: "Calle, número, comuna, región, info adicional"
- `destination_address`: "Calle, número, comuna, región, info adicional"

---

## 📊 EJEMPLO DE DATOS GUARDADOS

```json
{
  "client_name": "Juan Pérez",
  "client_email": "juan@email.com",
  "client_phone": "+56912345678",
  "scheduled_date": "2024-12-20",
  "scheduled_time": "10:00",
  "status": "pending",
  
  "payment_type": "completo",
  "total_price": 57000,
  "origin_address": "Av Providencia, 123, Providencia, Región Metropolitana, Depto 402",
  "destination_address": "Las Condes, 456, Las Condes, Región Metropolitana, Casa con jardín"
}
```

---

## ⚠️ IMPORTANTE

### Lo que NO se modificó:
- ✅ Estructura existente de la base de datos
- ✅ Datos anteriores (se mantienen intactos)
- ✅ APIs existentes (siguen funcionando)
- ✅ Flujo de cotización (igual que antes)
- ✅ Admin panel (sigue igual)

### Lo que SÍ cambió:
- ✅ Nuevas reservas guardan información adicional
- ✅ **payment_type** indica el tipo de pago elegido
- ✅ **total_price** guarda el precio final
- ✅ **origin_address** y **destination_address** guardan las direcciones completas

---

## 🎯 CÓDIGO MODIFICADO

### Archivos cambiados:
1. **`src/app/api/bookings/create/route.ts`**
   - Recibe los nuevos campos
   - Los guarda en la base de datos

2. **`src/components/steps/SummaryStep.tsx`**
   - Construye las direcciones completas
   - Determina el tipo de pago elegido
   - Calcula el precio final según el tipo de pago
   - Envía los datos nuevos al crear la reserva

### Archivos NO tocados:
- ✅ Cualquier otro archivo del proyecto
- ✅ Base de datos (solo agregó columnas, no eliminó nada)
- ✅ Flujo existente

---

## 📝 NOTAS

### Formato de Direcciones:

**Origen:**
```
Calle Principal, 123, Las Condes, Región Metropolitana, Depto 402
```

**Destino:**
```
Av Los Leones, 456, Providencia, Región Metropolitana, Casa con garage
```

### Precios Guardados:

- **payment_type: "completo"** → precio con 5% descuento (95% del precio total)
- **payment_type: "mitad"** → 50% del precio total

---

## 🐛 SI ALGO SALE MAL

### Si las columnas no se agregan:

1. Verifica que ejecutaste el SQL correctamente
2. Ejecuta en Supabase SQL Editor:

```sql
-- Verificar que las columnas existen
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY column_name;
```

Debes ver: `destination_address`, `origin_address`, `payment_type`, `total_price`

### Si los datos no se guardan:

1. Verifica los logs en la consola del navegador (F12)
2. Verifica los logs en Vercel (Deployments → Latest → Functions)

---

## ✅ LISTO

Una vez completados los pasos, las nuevas reservas guardarán toda la información adicional que necesitas.

**No se rompió nada, solo se agregaron campos nuevos. Los datos antiguos siguen ahí intactos.**


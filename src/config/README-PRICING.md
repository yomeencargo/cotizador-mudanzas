# 💰 Configuración de Precios

Este archivo (`pricing.ts`) centraliza **TODOS** los precios del sistema de cotización de mudanzas.

## 📝 Cómo Usar

Simplemente abre `src/config/pricing.ts` y edita los valores según tus necesidades.

### ✅ Ejemplo de Edición:

```typescript
export const PRICING = {
  basePrice: 30000,  // Cambia este valor para modificar el precio base
  // ...
}
```

## 🔢 Valores Disponibles

### 1. **Precio Base** (Mínimo)
- `basePrice`: Precio mínimo del servicio (siempre se cobra)
- **Actual:** $30,000

### 2. **Cálculo por Volumen**
- `pricePerCubicMeter`: Precio por cada metro cúbico (m³)
- **Actual:** $2,000 por m³
- **Ejemplo:** 10 m³ = $20,000 adicionales

### 3. **Cálculo por Distancia**
- `freeKilometers`: Kilómetros incluidos en el precio base (GRATIS)
  - **Actual:** 50 km gratis
- `pricePerKilometer`: Precio por cada kilómetro ADICIONAL (después de los km gratis)
  - **Actual:** $500 por km
- **Ejemplo 1:** Mudanza de 30 km = $0 adicionales (está dentro de los 50 km gratis)
- **Ejemplo 2:** Mudanza de 80 km = (80 - 50) × $500 = $15,000 adicionales

### 4. **Pisos Sin Ascensor**
- `pricePerFloorNoElevator`: Precio por cada piso sin ascensor
- **Actual:** $5,000 por piso
- **Se aplica a:** Origen Y Destino
- **Ejemplo:** Piso 3 origen + Piso 5 destino = $40,000

### 5. **Servicios Adicionales**
```typescript
services: {
  disassembly: 15000,  // Desarme de muebles
  assembly: 15000,     // Armado de muebles
  packing: 20000,      // Embalaje profesional general
  unpacking: 10000,    // Desembalaje
}
```

### 6. **Embalaje Especial por Item**
```typescript
packaging: {
  none: 0,            // Sin embalaje
  film: 5000,         // Film plástico
  cardboard: 8000,    // Cartón corrugado
  box: 12000,         // Caja de cartón
  boxPremium: 18000,  // Caja + embalaje interior
}
```
**Nota:** Estos precios se multiplican por la cantidad de items.

### 7. **Cargos Especiales**
- `fragileItemSurcharge`: Cargo adicional por cada item frágil/vidrio
  - **Actual:** $3,000 por item
- `saturdaySurcharge`: Cargo adicional por mudanza en sábado
  - **Actual:** $10,000

### 8. **Descuentos**
- `flexibilityDiscount`: Descuento por flexibilidad de fecha
  - **Actual:** 0.10 (10% de descuento)
  - **Formato:** Decimal (0.10 = 10%, 0.15 = 15%, etc.)

## ⚠️ Importante

### Puedes usar `0` para desactivar cualquier cargo:

```typescript
export const PRICING = {
  saturdaySurcharge: 0,  // No cobrar sábados
  fragileItemSurcharge: 0,  // No cobrar por items frágiles
  // ...
}
```

### Cálculo Final:

El precio total se calcula sumando:
```
TOTAL = 
  + Precio base ($30,000) - incluye hasta 50 km
  + (Volumen × $2,000)
  + (Max(0, Distancia - 50 km) × $500) ← Solo km después de 50
  + (Pisos sin ascensor × $5,000)
  + (Sábado? $10,000 : $0)
  + Servicios adicionales seleccionados
  + Embalaje por item
  + (Items frágiles × $3,000)
  - (10% si tiene flexibilidad)
```

## 🚀 Cambios Recientes

- ✅ **Geoapify API integrado** - Cálculo real de distancia entre direcciones
- ✅ **Primeros 50 km gratis** - Solo se cobra después del umbral
- ✅ **Cargo de sábado ahora se suma correctamente**
- ✅ **Todos los precios centralizados en un solo archivo**
- ✅ **Permite usar 0 para desactivar cargos**

## 🗺️ **Distancia y Geoapify API**

### **¿Cómo funciona?**
1. Usuario ingresa direcciones de origen y destino
2. Sistema consulta Geoapify API
3. Calcula km reales entre las direcciones
4. Cobra solo por km que excedan `freeKilometers` (50 km)

### **Sin API Key:**
- Sistema funciona normalmente
- Usa 10 km por defecto
- Ver `GEOAPIFY-SETUP.md` para configurar

### **Configurar API Key:**
1. Lee el archivo `GEOAPIFY-SETUP.md` en la raíz del proyecto
2. Sigue los pasos (toma 5 minutos)
3. Es GRATIS hasta 40,000 requests/mes

## 📍 Archivos Afectados

Este archivo de configuración afecta a:
- `src/store/quoteStore.ts` (cálculos)
- `src/components/steps/AdditionalServicesStep.tsx` (servicios)
- `src/components/steps/ItemsSelectionStep.tsx` (embalaje)
- `src/components/steps/SummaryStep.tsx` (resumen)

**¡No necesitas editar ningún otro archivo para cambiar precios!** 🎉


# 🚀 Optimizaciones de Llamadas a API

Este documento explica todas las optimizaciones implementadas para minimizar llamadas a Geoapify API.

## 1. **Debouncing en Autocomplete** ✅

**Ubicación:** `src/components/ui/AddressAutocomplete.tsx`

**Cómo funciona:**
- Cuando el usuario escribe, se espera 300ms antes de hacer la llamada a autocomplete
- Si el usuario sigue escribiendo, se cancela la petición anterior y se inicia un nuevo debounce
- Esto evita hacer 1 llamada por cada carácter que escribe

**Ejemplo:**
```
Usuario escribe: "Avenida..."
a       → (espera 300ms)
av      → (cancela anterior, espera 300ms)
ave     → (cancela anterior, espera 300ms)
aven    → (cancela anterior, espera 300ms)
... solo hace 1 llamada después de 300ms sin escribir
```

**Impacto:** Reduce ~90% de llamadas durante la búsqueda.

---

## 2. **Caché en Memoria de Resultados** ✅

**Ubicación:** `src/lib/mapsService.ts`

**Cómo funciona:**
- Se guarda cada resultado en un Map en memoria
- Si se busca la misma dirección/distancia, se devuelve del caché inmediatamente
- No hace llamada a API si ya existe en caché

**Ejemplo de Caché:**
```javascript
geocodeCache = {
  "avenida borgoño,251,concón,valparaiso": { lat: -32.928298, lng: -71.550272 },
  "avenida chicureo,860,colina,metropolitana": { lat: -33.287322, lng: -70.693 },
  ...
}

distanceCache = {
  "-32.928298,-71.550272,-33.287322,-70.693": { kilometers: 150, duration: 120 },
  ...
}
```

**Impacto:** Resultados inmediatos (0ms) en búsquedas repetidas.

---

## 3. **Deduplicación de Peticiones** ✅

**Ubicación:** `src/lib/mapsService.ts`

**Cómo funciona:**
- Si hay 2 solicitudes simultáneas para la misma dirección/distancia, solo se hace 1 llamada a API
- La segunda solicitud espera el resultado de la primera
- Ambas comparten el mismo resultado

**Ejemplo:**
```
Tiempo 0ms: Item 1 solicita geocode("Avenida Borgoño 251")
Tiempo 1ms: Item 2 solicita geocode("Avenida Borgoño 251")
            → Item 2 espera a Item 1 (en progreso)
Tiempo 50ms: Item 1 obtiene resultado
             → Item 2 también obtiene resultado (sin hacer nueva API call)
```

**Impacto:** Evita duplicar llamadas en renders simultáneos.

---

## 4. **Eliminación de Llamadas Redundantes** ✅

**Ubicación:** `src/app/api/maps/autocomplete/route.ts`

**Cómo funciona:**
- El endpoint `/api/maps/autocomplete` devuelve todos los datos necesarios
- NO hace una segunda llamada a `/api/maps/place-details` como antes
- Todo está en una única petición

**Antes:** 2 llamadas por cada autocomplete
```
autocomplete → datos básicos
place-details → datos completos
```

**Ahora:** 1 llamada por autocomplete
```
autocomplete → datos completos (incluye city, district, street, number, etc.)
```

**Impacto:** 50% menos de llamadas a API.

---

## 5. **Orden Correcto de Coordenadas** ✅

**Ubicación:** `src/app/api/maps/distance/route.ts`

**Cómo funciona:**
- Geoapify Routing requiere `lat,lon` (NOT `lon,lat` como en GeoJSON)
- Se corrigió el orden para evitar errores 400

**Impacto:** Evita re-intentos fallidos de cálculo de distancia.

---

## 📊 Cálculo de Ahorro

### Escenario: 50 items con distancia a calcular

**SIN optimizaciones:**
```
Por item:
- 2 geocodes (origen/destino) × 50 items = 100 llamadas
- 1 distancia × 50 items = 50 llamadas
Total sin caché: 150 llamadas
```

**CON optimizaciones (todas excepto caché):**
```
Por item:
- 1 geocode origen (compartida con otros) = 1 llamada
- 1 geocode destino (compartida con otros) = 1 llamada
- 1 distancia = 1 llamada
Total: ~3 llamadas (deduplicación + única llamada por dirección)
```

**CON TODAS LAS OPTIMIZACIONES:**
```
Primera carga: ~3 llamadas
Segunda carga: 0 llamadas (todo en caché)

Ahorro: ~98% en segunda carga
```

---

## 🛠️ Funciones Útiles

### Ver estadísticas de caché:
```javascript
import { getCacheStats } from '@/lib/mapsService'

console.log(getCacheStats())
// Salida:
// {
//   geocodeCache: { size: 5, keys: [...] },
//   distanceCache: { size: 3, keys: [...] },
//   pendingRequests: { geocode: 0, distance: 0 }
// }
```

### Limpiar caché:
```javascript
import { clearCache, clearGeocodeCache, clearDistanceCache } from '@/lib/mapsService'

clearCache()            // Limpia todo
clearGeocodeCache()     // Solo geocoding
clearDistanceCache()    // Solo distancias
```

---

## 💡 Recomendaciones

1. **Para producción:** Agregar persistencia en localStorage o IndexedDB
2. **Para múltiples usuarios:** Limpiar caché al cambiar de sesión
3. **Para móvil:** Considerar TTL (time-to-live) para ahorrar memoria
4. **Monitoreo:** Usar `getCacheStats()` para ver uso de caché

---

## 🔍 Debugging

Los logs en consola te muestran:
- `📦 Geocode caché hit` - Resultado desde caché
- `⏳ Geocode request en progreso` - Esperando petición en progreso
- `💾 Geocode guardado en caché` - Resultado guardado en caché
- `✨ Cache limpiado` - Caché limpiada

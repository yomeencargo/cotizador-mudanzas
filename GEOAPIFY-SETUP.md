# 🗺️ Configuración de Geoapify API

## 📋 **Pasos para Obtener tu API Key**

### 1. **Crear Cuenta en Geoapify**
- Ve a: [Geoapify.com](https://www.geoapify.com/)
- Click en "Get Started" o "Sign Up"
- Completa el registro con tu email

### 2. **Crear un Proyecto**
- Una vez logueado, ve a "My Projects"
- Click en "Create New Project"
- Dale un nombre descriptivo (ej: "Cotizador Mudanzas")
- Selecciona el plan gratuito

### 3. **Obtener API Key**
- En tu proyecto, encontrarás tu API Key
- Copia la key completa (empieza con algo como `abc123...`)

### 4. **Configurar en tu Proyecto**

#### Crear archivo `.env.local`
```bash
# En la raíz del proyecto, crea un archivo llamado: .env.local
# Agrega esta línea (reemplaza con tu key real):

NEXT_PUBLIC_GEOAPIFY_API_KEY=tu_api_key_aqui
```

### 5. **Reiniciar el Servidor**
```bash
# Detén el servidor (Ctrl + C)
# Vuelve a iniciar:
npm run dev
```

---

## 💰 **Costos y Límites**

### **Plan Gratuito:**
- ✅ **90,000 requests/mes GRATIS**
- ✅ **Sin límite de tiempo**
- ✅ **Sin tarjeta de crédito requerida**

### **¿Cuánto gastarás?**
Supongamos un usuario promedio:
- 1 cotización = 2-3 autocomplete + 2 place details + 2 geocoding + 1 distance matrix
- **Total por cotización:** ~7-8 requests combinados
- **Con el plan gratuito:** ~11,000 cotizaciones/mes GRATIS

**Conclusión:** Para la mayoría de negocios pequeños/medianos, es TOTALMENTE GRATIS ✅

### **Planes de Pago (si necesitas más):**
- **Starter:** $9/mes - 300,000 requests/mes
- **Pro:** $29/mes - 1,000,000 requests/mes
- **Enterprise:** Contactar para volúmenes mayores

---

## 🔒 **Seguridad (IMPORTANTE)**

### **Restringir tu API Key en Producción:**

1. Ve a tu proyecto en Geoapify
2. Click en "API Keys" → "Settings"
3. En "HTTP Referrers":
   - Agrega: `https://tudominio.com/*`
   - Agrega: `https://www.tudominio.com/*`
4. En "IP Restrictions" (opcional):
   - Agrega las IPs de tus servidores

### **¿Por qué es importante?**
- Previene que otros usen tu API key
- Evita cargos no autorizados
- Protege tu cuenta de Geoapify

---

## 🧪 **Verificar que Funciona**

### **Sin API Key:**
- El sistema funciona pero usa 10 km por defecto
- En consola verás: `"Geoapify API key not configured"`

### **Con API Key:**
- ✅ Autocompletado inteligente de direcciones (búsqueda mientras escribes)
- ✅ El sistema calcula distancia real entre direcciones
- ✅ Autocompletado de campos: calle, número, comuna, región
- ✅ En consola verás los km calculados
- ✅ El precio se ajusta según distancia real

### **Debugging:**
Abre la consola del navegador (F12) y busca:
```
✅ "Distancia calculada exitosamente"
❌ "Geoapify API key not configured" → Falta configurar
❌ "Geocoding failed: ERROR" → API key inválida o problemas de red
```

### **Arquitectura (Solución CORS):**
El sistema usa una arquitectura de 3 capas para evitar errores de CORS:
1. **Frontend** → Llama a `/api/maps/geocode`, `/api/maps/autocomplete` y `/api/maps/distance`
2. **API Routes (Next.js)** → Actúan como proxy desde el servidor
3. **Geoapify API** → Recibe llamadas desde el servidor (sin CORS)

---

## 🚨 **Problemas Comunes**

### **Error: "Geoapify API key not configured"**
**Causa:** API Key no configurada o archivo .env.local no existe  
**Solución:**
1. Verifica que el archivo `.env.local` existe en la raíz del proyecto
2. Confirma que la variable `NEXT_PUBLIC_GEOAPIFY_API_KEY` está definida
3. Reinicia el servidor (`npm run dev`)

### **Error: "Geocoding failed: ERROR"**
**Causa:** API Key inválida o problemas de red  
**Solución:**
1. Verifica que copiaste bien la key de Geoapify
2. Confirma que la key está activa en tu proyecto
3. Revisa la consola para más detalles del error

### **Error: "ZERO_RESULTS"**
**Causa:** Dirección no encontrada  
**Solución:**
- El sistema usa 10 km por defecto automáticamente
- Verifica que las direcciones estén completas y sean válidas

### **La distancia siempre es 10 km**
**Causa:** API key no configurada o fallando  
**Solución:**
1. Revisa que `.env.local` existe y tiene la key
2. Reinicia el servidor (`npm run dev`)
3. Verifica en consola si hay errores

---

## 📊 **Monitorear Uso**

Ve a tu proyecto en Geoapify → "Usage Statistics"

Ahí verás:
- Requests por día/mes
- Cuánto te queda del plan gratuito
- Errores si los hay
- Estadísticas detalladas

---

## ✨ **Ventajas de Geoapify vs Google Maps**

### **💰 Costos:**
- **Geoapify:** 90,000 requests/mes GRATIS
- **Google Maps:** 10,000 requests/mes GRATIS (nuevo modelo 2025)

### **🔧 Flexibilidad:**
- **Geoapify:** Sin restricciones de almacenamiento de datos
- **Google Maps:** Restricciones estrictas de uso

### **📈 Estabilidad:**
- **Geoapify:** APIs estables, no marcadas como "legacy"
- **Google Maps:** APIs marcadas como "legacy" (pueden desaparecer)

### **🌍 Cobertura:**
- **Geoapify:** Excelente cobertura en Chile (basado en OpenStreetMap)
- **Google Maps:** Cobertura global robusta

### **🆘 Soporte:**
- **Geoapify:** Soporte técnico directo y rápido
- **Google Maps:** Documentación extensa pero soporte limitado

---

## 💡 **Notas Adicionales**

### **¿Qué pasa si no configuro la API?**
✅ El cotizador funciona perfectamente
✅ Usa 10 km por defecto
❌ No calcula distancia real
❌ No hay autocompletado de direcciones

### **¿Puedo cambiar los km gratis?**
✅ Sí, en `src/config/pricing.ts`:
```typescript
freeKilometers: 50, // Cambia este número
```

### **¿Cómo se cobra?**
- Primeros 50 km: INCLUIDOS en precio base
- Después de 50 km: $500 por cada km adicional

**Ejemplo:**
- Mudanza de 30 km: $0 por distancia
- Mudanza de 80 km: (80 - 50) × $500 = $15,000 adicionales

---

## 📞 **¿Necesitas Ayuda?**

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que el archivo `.env.local` existe
3. Confirma que reiniciaste el servidor
4. Lee los errores en consola - son descriptivos
5. Revisa las estadísticas de uso en Geoapify

---

## 🚀 **Migración Completada**

**¡Felicidades!** Has migrado exitosamente de Google Maps a Geoapify:

✅ **Ahorras dinero** - Plan gratuito más generoso  
✅ **Mayor estabilidad** - APIs no marcadas como legacy  
✅ **Más flexibilidad** - Sin restricciones de datos  
✅ **Mejor soporte** - Atención técnica directa  

---

**¡Listo! Con esto deberías tener Geoapify funcionando perfectamente.** 🎉

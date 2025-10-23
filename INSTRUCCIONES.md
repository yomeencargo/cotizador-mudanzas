# 📋 INSTRUCCIONES PARA EJECUTAR EL PROYECTO

## 🎯 Pasos para Verlo en el Navegador

### 1️⃣ Abrir Terminal en la Carpeta del Proyecto

Asegúrate de estar en la carpeta: `C:\Users\nicob\Desktop\IA en Blanco\COTIZADOR - YO ME ENCARGO\Test 1`

### 2️⃣ Instalar Dependencias

Ejecuta este comando en la terminal:

```bash
npm install
```

⏱️ Esto tomará unos minutos la primera vez.

### 3️⃣ Iniciar el Servidor de Desarrollo

Una vez instaladas las dependencias, ejecuta:

```bash
npm run dev
```

### 4️⃣ Abrir en el Navegador

Abre tu navegador favorito y ve a:

```
http://localhost:3000
```

## ✨ ¡Eso es Todo!

Deberías ver la pantalla de bienvenida del cotizador de mudanzas.

---

## 🎨 Cómo Usar la Aplicación

### Flujo Completo:

1. **Pantalla de Bienvenida**
   - Click en "Comenzar Cotización"

2. **Datos Personales**
   - Ingresa nombre, email y teléfono
   - Opcional: marca si es empresa

3. **Fecha y Hora**
   - Selecciona fecha del calendario
   - Elige horario preferido
   - Marca "flexibilidad" para 10% descuento

4. **Direcciones**
   - Origen: ingresa dirección completa
   - Destino: ingresa dirección completa
   - Usa el buscador de comunas

5. **Detalles de Propiedad**
   - Tipo de vivienda (casa, depto, etc.)
   - Piso y si tiene ascensor
   - Distancia de estacionamiento

6. **Selección de Items**
   - Busca y filtra por categorías
   - Agrega items con el botón +
   - Ajusta cantidades
   - Ve el volumen total en tiempo real

7. **Servicios Adicionales**
   - Marca servicios extras (embalaje, desarme, etc.)
   - Agrega observaciones
   - Sube fotos (opcional)

8. **Resumen y Confirmación**
   - Revisa toda la información
   - Ve el precio final calculado
   - Confirma la reserva o descarga PDF

---

## 🛠️ Comandos Útiles

### Desarrollo
```bash
npm run dev          # Inicia servidor de desarrollo
```

### Producción
```bash
npm run build        # Construye para producción
npm start            # Inicia servidor de producción
```

### Código
```bash
npm run lint         # Revisa errores
npm run format       # Formatea el código
```

---

## 📱 Probar en Diferentes Dispositivos

### En el Navegador:

1. **Móvil**: 
   - Presiona `F12` → Click en el ícono de dispositivo móvil
   - Selecciona iPhone/Android

2. **Tablet**: 
   - En DevTools, selecciona iPad

3. **Desktop**: 
   - Tamaño normal de ventana

---

## 🎯 Características Implementadas

✅ **Diseño Responsive**: Funciona perfecto en móvil, tablet y desktop  
✅ **Validaciones**: Todos los formularios tienen validación en tiempo real  
✅ **Cálculo Automático**: El precio se calcula mientras seleccionas items  
✅ **Guardado Automático**: Tus datos se guardan en el navegador  
✅ **UI Moderna**: Diseño profesional con animaciones suaves  
✅ **Chatbot de Ayuda**: Botón flotante para responder dudas  
✅ **Catálogo Completo**: Más de 30 items pre-configurados  
✅ **Descuentos**: Sistema de descuentos por flexibilidad  
✅ **Feedback Visual**: Mensajes de éxito/error en todas las acciones  

---

## 🔧 Personalización

### Cambiar Colores

Edita el archivo: `tailwind.config.ts`

```typescript
primary: {
  600: '#TU_COLOR_AQUI',
}
```

### Agregar Items

Edita el archivo: `src/data/itemsCatalog.ts`

### Modificar Precios

Edita el archivo: `src/store/quoteStore.ts` en la función `calculateTotals()`

---

## 🚀 Integrar APIs (Opcional)

Para funcionalidad completa, necesitarás API keys de:

1. **Google Places API**: Autocompletado de direcciones
   - Crear proyecto en Google Cloud Console
   - Habilitar Places API
   - Obtener API Key

2. **SendGrid**: Envío de emails
   - Crear cuenta en sendgrid.com
   - Obtener API Key

3. **WhatsApp Business API**: Notificaciones
   - Registrarse en Meta Business
   - Configurar WhatsApp API

4. **Webpay**: Pagos online
   - Contactar a Transbank
   - Obtener credenciales

Estas APIs son **OPCIONALES** - la aplicación funciona completamente sin ellas.

---

## 📂 Estructura del Proyecto

```
Test 1/
├── src/
│   ├── app/                    # Páginas principales
│   │   ├── page.tsx           # Página principal
│   │   ├── layout.tsx         # Layout global
│   │   ├── globals.css        # Estilos globales
│   │   └── api/               # Endpoints backend
│   ├── components/
│   │   ├── steps/             # Pasos del formulario (8 pasos)
│   │   └── ui/                # Componentes reutilizables
│   ├── store/                 # Estado global (Zustand)
│   ├── data/                  # Catálogo de items
│   └── lib/                   # Funciones auxiliares
├── public/                    # Archivos estáticos
├── package.json               # Dependencias
├── tsconfig.json              # Config TypeScript
├── tailwind.config.ts         # Config Tailwind
└── next.config.js             # Config Next.js
```

---

## ❓ Problemas Comunes

### 1. "npm no se reconoce como comando"

**Solución**: Necesitas instalar Node.js
- Descarga desde: https://nodejs.org/
- Instala la versión LTS
- Reinicia la terminal

### 2. "Puerto 3000 ocupado"

**Solución**: Usa otro puerto
```bash
PORT=3001 npm run dev
```

### 3. "Error al instalar dependencias"

**Solución**: Limpia e intenta de nuevo
```bash
rm -rf node_modules package-lock.json
npm install
```

### 4. La página se ve mal

**Solución**: Limpia la caché del navegador
- `Ctrl + Shift + R` (Windows)
- `Cmd + Shift + R` (Mac)

---

## 📞 Soporte

Si tienes problemas:

1. 📖 Lee el archivo `README.md` para documentación completa
2. 🚀 Consulta `QUICKSTART.md` para guía rápida
3. 📦 Revisa `DEPLOYMENT.md` para deploy en producción

---

## 🎉 Disfruta del Cotizador

El proyecto está **100% funcional** y listo para usar.

Características profesionales:
- ✨ Diseño moderno y atractivo
- 📱 Totalmente responsive
- ⚡ Rápido y optimizado
- 🎯 Experiencia de usuario excelente
- 🔒 Validaciones robustas
- 💾 Guardado automático
- 🤖 Chatbot integrado

---

**¡Buena suerte con tu cotizador! 🚚💙**


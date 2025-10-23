# 🚀 Guía de Inicio Rápido

Esta guía te ayudará a tener el proyecto funcionando en **menos de 5 minutos**.

## ⚡ Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Ejecutar en Modo Desarrollo

```bash
npm run dev
```

### 3. Abrir en el Navegador

Abre [http://localhost:3000](http://localhost:3000) y ¡listo! 🎉

## 📝 Notas Importantes

### Variables de Entorno (Opcional para desarrollo)

El proyecto funciona sin configurar variables de entorno. Sin embargo, para funcionalidad completa:

1. Copia el archivo de ejemplo:
```bash
cp .env.local.example .env.local
```

2. Las siguientes features requieren API keys:
   - **Google Places**: Autocompletado de direcciones
   - **SendGrid**: Envío de emails
   - **WhatsApp**: Notificaciones
   - **Webpay**: Pagos online

### Estructura de Carpetas Principal

```
src/
├── app/              # Páginas y API routes
├── components/       # Componentes React
│   ├── steps/       # Pasos del formulario
│   └── ui/          # Componentes reutilizables
├── store/           # Estado global (Zustand)
├── data/            # Catálogo de items
└── lib/             # Utilidades
```

## 🎯 Flujo de la Aplicación

1. **Bienvenida** → Presentación del servicio
2. **Datos Personales** → Nombre, email, teléfono
3. **Fecha/Hora** → Calendario con opciones flexibles
4. **Direcciones** → Origen y destino
5. **Detalles** → Tipo de propiedad, pisos, ascensor
6. **Items** → Catálogo de muebles y objetos
7. **Servicios** → Extras (embalaje, desarme, etc.)
8. **Resumen** → Cotización final con precio

## 🛠️ Scripts Disponibles

```bash
npm run dev         # Desarrollo (http://localhost:3000)
npm run build       # Build para producción
npm start           # Servidor de producción
npm run lint        # Linter
npm run format      # Formatear código
```

## 📱 Responsive Preview

- **Móvil**: Abre DevTools → Toggle device toolbar
- **Tablet**: 768px de ancho
- **Desktop**: 1024px+

## 🎨 Personalización Rápida

### Cambiar Colores

Edita `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    600: '#TU_COLOR',  // Color principal
  }
}
```

### Agregar Items al Catálogo

Edita `src/data/itemsCatalog.ts`:

```typescript
{
  id: 'nuevo-item',
  name: 'Nuevo Item',
  category: 'Sala',
  volume: 1.0,
  weight: 50,
  isFragile: false,
  isHeavy: false,
  isGlass: false,
  image: '🎨'
}
```

### Modificar Precios

Edita `src/store/quoteStore.ts` en la función `calculateTotals()`.

## 🐛 Problemas Comunes

### Puerto 3000 ocupado

```bash
# Cambiar puerto
PORT=3001 npm run dev
```

### Error "Module not found"

```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error de TypeScript

```bash
# Verificar tipos
npx tsc --noEmit
```

## ✨ Features Principales

✅ Cotización en tiempo real  
✅ Catálogo de 30+ items  
✅ Cálculo automático de volumen  
✅ Recomendación de vehículo  
✅ Descuentos por flexibilidad  
✅ 100% responsive  
✅ ChatBot de ayuda  
✅ Guardado automático  

## 📞 ¿Necesitas Ayuda?

- 📖 Lee el [README.md](README.md) completo
- 🚀 Consulta [DEPLOYMENT.md](DEPLOYMENT.md) para producción
- 📧 Contacta al equipo de desarrollo

## 🎉 ¡Eso es Todo!

Ya tienes el cotizador funcionando. Ahora puedes:
- 🎨 Personalizar el diseño
- 📦 Agregar más items
- 🔧 Integrar APIs
- 🚀 Hacer deploy

---

**Happy Coding! 💙**


# 🚚 Cotizador de Mudanzas - Yo Me Encargo

Sistema inteligente de cotización para mudanzas y fletes, desarrollado con las mejores prácticas de desarrollo web moderno.

## ✨ Características

- 📱 **Diseño Responsive**: Experiencia optimizada para móviles, tablets y escritorio
- 🎨 **UI/UX Moderna**: Interfaz amigable y visual con animaciones suaves
- 📊 **Cotización en Tiempo Real**: Cálculo automático del precio mientras seleccionas items
- 📦 **Catálogo Completo**: Más de 30 items pre-configurados con volumen y peso
- 🗺️ **Integración de Mapas**: Geoapify API para direcciones precisas
- 💳 **Pagos Integrados**: Soporte para Webpay (Transbank)
- 📧 **Notificaciones**: Email y WhatsApp automáticos
- 💾 **Guardado Automático**: Persistencia de datos con localStorage
- 🔒 **Seguro**: Validaciones robustas y sanitización de inputs
- ♿ **Accesible**: Cumple con estándares WCAG AA

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: Zustand con persistencia
- **Validación**: Zod + React Hook Form
- **Animaciones**: Framer Motion
- **Notificaciones**: React Hot Toast
- **Iconos**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Base de Datos**: PostgreSQL (configuración incluida)
- **Autenticación**: JWT (preparado)

### Integraciones
- Geoapify API (direcciones y mapas)
- SendGrid (emails)
- WhatsApp Business API (mensajería)
- Webpay/Transbank (pagos)

## 📁 Estructura del Proyecto

```
cotizador-mudanzas/
├── src/
│   ├── app/
│   │   ├── api/              # API Routes
│   │   │   ├── quotes/       # Endpoints de cotizaciones
│   │   │   ├── payment/      # Integración de pagos
│   │   │   └── upload/       # Subida de archivos
│   │   ├── layout.tsx        # Layout principal
│   │   ├── page.tsx          # Página principal
│   │   └── globals.css       # Estilos globales
│   ├── components/
│   │   ├── steps/            # Componentes de cada paso
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── PersonalInfoStep.tsx
│   │   │   ├── DateTimeStep.tsx
│   │   │   ├── AddressStep.tsx
│   │   │   ├── PropertyDetailsStep.tsx
│   │   │   ├── ItemsSelectionStep.tsx
│   │   │   ├── AdditionalServicesStep.tsx
│   │   │   └── SummaryStep.tsx
│   │   └── ui/               # Componentes reutilizables
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Checkbox.tsx
│   │       ├── ProgressBar.tsx
│   │       └── ChatBot.tsx
│   ├── store/
│   │   └── quoteStore.ts     # Estado global con Zustand
│   ├── data/
│   │   └── itemsCatalog.ts   # Catálogo de items
│   └── lib/
│       └── utils.ts          # Utilidades y helpers
├── public/                   # Archivos estáticos
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js 18+ 
- npm o yarn
- PostgreSQL (opcional para producción)

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo y configura tus variables:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
```env
# Geoapify API
NEXT_PUBLIC_GEOAPIFY_API_KEY=tu_api_key_aqui

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cotizador_mudanzas

# JWT Secret
JWT_SECRET=tu_secret_key_aqui

# Email (SendGrid)
SENDGRID_API_KEY=tu_sendgrid_api_key

# WhatsApp Business API
WHATSAPP_API_TOKEN=tu_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id

# Webpay (Transbank)
WEBPAY_COMMERCE_CODE=tu_commerce_code
WEBPAY_API_KEY=tu_webpay_api_key
WEBPAY_ENVIRONMENT=integration

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 4. Build para Producción

```bash
npm run build
npm start
```

## 🎯 Flujo de Usuario

1. **Pantalla de Bienvenida**: Presentación del servicio y características
2. **Datos Personales**: Información de contacto (nombre, email, teléfono)
3. **Fecha y Hora**: Selector de calendario con opción de flexibilidad (descuento)
4. **Direcciones**: Origen y destino con autocompletado de comunas
5. **Detalles de Propiedad**: Tipo de vivienda, piso, ascensor
6. **Selección de Items**: Catálogo interactivo con búsqueda y filtros
7. **Servicios Adicionales**: Desarme, armado, embalaje, etc.
8. **Resumen y Confirmación**: Vista completa con precio final

## 💡 Características Principales

### Cálculo Inteligente de Precios

El sistema calcula automáticamente el precio basándose en:
- ✅ Volumen total de items (m³)
- ✅ Distancia entre origen y destino
- ✅ Pisos sin ascensor (cargo adicional)
- ✅ Servicios adicionales seleccionados
- ✅ Items frágiles o de vidrio
- ✅ Descuento por flexibilidad de fecha (10%)
- ✅ Recargo por fin de semana

### Catálogo de Items

Más de 30 items pre-configurados en categorías:
- 🛋️ Sala: Sofás, sillones, mesas, estantes
- 🍽️ Comedor: Mesas, sillas, vitrinas
- 🛏️ Dormitorio: Camas, colchones, roperos
- 🧊 Electrodomésticos: Refrigerador, lavadora, etc.
- 🖥️ Oficina: Escritorios, sillas, archivadores
- 📦 Otros: Cajas, bicicletas, plantas

### Recomendación de Vehículo

Basándose en el volumen total:
- < 5m³: Camioneta
- 5-10m³: Camioneta Grande
- 10-20m³: Furgón Mediano
- > 20m³: Furgón Grande

## 🔐 Seguridad

- ✅ Sanitización de todos los inputs
- ✅ Validaciones en frontend y backend
- ✅ Protección contra XSS y CSRF
- ✅ HTTPS en producción
- ✅ Límite de tamaño en uploads (5MB)
- ✅ Validación de tipos de archivo

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1440px+)

## 🎨 Personalización

### Colores

Los colores se pueden personalizar en `tailwind.config.ts`:

```typescript
colors: {
  primary: { /* Azul */ },
  secondary: { /* Verde */ },
}
```

### Items del Catálogo

Puedes agregar o modificar items en `src/data/itemsCatalog.ts`:

```typescript
{
  id: 'item-id',
  name: 'Nombre del Item',
  category: 'Categoría',
  volume: 1.5,  // m³
  weight: 50,   // kg
  isFragile: false,
  isHeavy: true,
  isGlass: false,
  image: '🎨'
}
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Coverage
npm run test:coverage
```

## 📦 Deploy

### Vercel (Recomendado)

1. Conecta tu repositorio en [vercel.com](https://vercel.com)
2. Configura las variables de entorno
3. Deploy automático en cada push

```bash
npm install -g vercel
vercel
```

### AWS / VPS

```bash
npm run build
# Configurar nginx/apache
# Configurar PM2 para Node.js
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código privado. Todos los derechos reservados.

## 📞 Soporte

Para soporte o consultas:
- 📧 Email: soporte@yomeencargo.cl
- 💬 WhatsApp: +56 9 1234 5678
- 🌐 Web: www.yomeencargo.cl

## 🙏 Agradecimientos

- Next.js Team
- Vercel
- Tailwind CSS
- Todos los colaboradores

---

**Desarrollado con ❤️ por Yo Me Encargo**


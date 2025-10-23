# 📦 Guía de Deployment

Esta guía te ayudará a deployar el Cotizador de Mudanzas en diferentes plataformas.

## 🚀 Deploy en Vercel (Recomendado)

Vercel es la plataforma recomendada para aplicaciones Next.js.

### Paso 1: Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Crea una cuenta (puedes usar GitHub)

### Paso 2: Importar el Proyecto

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

O desde la interfaz web:
1. Click en "Add New Project"
2. Importa tu repositorio de GitHub
3. Configura las variables de entorno
4. Click en "Deploy"

### Paso 3: Configurar Variables de Entorno

En el dashboard de Vercel:
1. Settings → Environment Variables
2. Agrega todas las variables de `.env.local.example`

### Variables Necesarias:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
DATABASE_URL=
JWT_SECRET=
SENDGRID_API_KEY=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WEBPAY_COMMERCE_CODE=
WEBPAY_API_KEY=
WEBPAY_ENVIRONMENT=production
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

### Paso 4: Configurar Dominio (Opcional)

1. Settings → Domains
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones

## 🐳 Deploy con Docker

### Dockerfile

```dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/cotizador
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: cotizador
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Ejecutar con Docker

```bash
# Build
docker-compose build

# Run
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

## ☁️ Deploy en AWS

### Opción 1: AWS Amplify

1. Conecta tu repositorio de GitHub
2. Amplify detectará automáticamente Next.js
3. Configura las variables de entorno
4. Deploy automático

### Opción 2: EC2 + PM2

```bash
# En tu servidor EC2
git clone tu-repo
cd cotizador-mudanzas
npm install
npm run build

# Instalar PM2
npm install -g pm2

# Iniciar la aplicación
pm2 start npm --name "cotizador" -- start

# Guardar configuración de PM2
pm2 save
pm2 startup
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🗄️ Configuración de Base de Datos

### PostgreSQL en Supabase (Recomendado)

1. Crea una cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Copia la connection string
4. Agrega a `DATABASE_URL` en las variables de entorno

### PostgreSQL Local

```bash
# Crear base de datos
createdb cotizador_mudanzas

# Schema básico
psql cotizador_mudanzas
```

```sql
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    personal_info JSONB NOT NULL,
    date_time TIMESTAMP NOT NULL,
    is_flexible BOOLEAN DEFAULT false,
    origin JSONB NOT NULL,
    destination JSONB NOT NULL,
    items JSONB NOT NULL,
    additional_services JSONB,
    total_volume DECIMAL(10,2),
    total_weight DECIMAL(10,2),
    estimated_price DECIMAL(10,2),
    recommended_vehicle VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);
```

## 📧 Configuración de SendGrid

1. Crea una cuenta en [sendgrid.com](https://sendgrid.com)
2. Verifica tu dominio
3. Crea un API Key
4. Agrega a `SENDGRID_API_KEY`

### Template de Email

Crea un template dinámico en SendGrid con estos campos:
- `{{name}}`
- `{{quote_number}}`
- `{{estimated_price}}`
- `{{date_time}}`
- `{{origin_address}}`
- `{{destination_address}}`

## 💬 Configuración de WhatsApp Business API

1. Regístrate en [Meta Business](https://business.facebook.com)
2. Configura WhatsApp Business API
3. Obtén el token de acceso
4. Configura el webhook para recibir mensajes

## 💳 Configuración de Webpay (Transbank)

### Ambiente de Integración

1. Regístrate en [Transbank Developers](https://www.transbankdevelopers.cl)
2. Obtén credenciales de integración
3. Configura el Commerce Code y API Key

### Ambiente de Producción

1. Solicita credenciales de producción a Transbank
2. Actualiza las variables de entorno
3. Cambia `WEBPAY_ENVIRONMENT` a `production`

## 🔒 SSL/HTTPS

### Con Vercel
- Automático y gratuito

### Con Let's Encrypt (Nginx)

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com

# Renovación automática
sudo certbot renew --dry-run
```

## 📊 Monitoreo

### Configurar Sentry (Errores)

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### Configurar Google Analytics

```javascript
// En app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  )
}
```

## ✅ Checklist Pre-Deploy

- [ ] Variables de entorno configuradas
- [ ] Base de datos creada y migrada
- [ ] API Keys de terceros obtenidas
- [ ] SSL configurado
- [ ] Dominio configurado
- [ ] Email templates creados
- [ ] Webhooks configurados
- [ ] Backups automáticos configurados
- [ ] Monitoreo de errores activo
- [ ] Analytics configurado

## 🔄 CI/CD con GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          vercel-args: '--prod'
```

## 🆘 Troubleshooting

### Error: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error de Build
```bash
npm run build -- --debug
```

### Error de Variables de Entorno
- Verifica que todas las variables estén configuradas
- Reinicia el servidor después de cambios

## 📞 Soporte

Si tienes problemas con el deployment:
- 📧 Email: dev@yomeencargo.cl
- 📚 Documentación: docs.yomeencargo.cl

---

**¡Listo para producción! 🚀**


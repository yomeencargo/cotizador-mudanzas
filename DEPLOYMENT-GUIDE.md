# 🚀 GUÍA DE DEPLOYMENT - Vercel + Supabase

## ✅ LO QUE YA HICIMOS

- ✅ BD en Supabase (PostgreSQL en la nube)
- ✅ API Endpoints para bookings
- ✅ DateTimeStep mejorado (solo muestra horarios disponibles)
- ✅ Sistema de multi-camiones funcional
- ✅ SummaryStep conectado a BD

## 📋 PASO A PASO

### PASO 1: Configurar Supabase (15 min)

1. Ir a https://supabase.com
2. Sign up con GitHub (más fácil)
3. Crear proyecto nuevo:
   - Name: `cotizador-mudanzas`
   - Database password: [genera uno fuerte]
   - Region: `South America (São Paulo)`
   - Click "Create"
4. Esperar 2 minutos

### PASO 2: Crear Tablas en Supabase (5 min)

En Supabase → SQL Editor → New Query → Ejecutar el SQL que viene en `SQL_SCHEMA.sql`

```sql
-- (Ver archivo SQL_SCHEMA.sql en este directorio)
```

### PASO 3: Obtener Credenciales (5 min)

En Supabase → Settings → API

Copiar y guardar:
- `Project URL`
- `anon public key` 
- `service_role key`

### PASO 4: Crear .env.local (5 min)

```bash
# En tu PC, crear archivo: .env.local
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

NEXT_PUBLIC_GEOAPIFY_API_KEY=TU_API_KEY_AQUI
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### PASO 5: Probar en Local (5 min)

```bash
npm run dev
# Abre http://localhost:3000
```

**Prueba:**
- Selecciona una fecha → Deberías ver solo 6 horarios (08:00 - 15:00)
- Si hay 3 camiones, todos deberían estar verdes
- Selecciona uno → Debe mostrar "1 disponible"

### PASO 6: Push a GitHub (5 min)

```bash
git add .
git commit -m "Add Supabase booking system"
git push origin main
```

### PASO 7: Deploy en Vercel (10 min)

**Opción A: Vía CLI**
```bash
npm install -g vercel
vercel
# Sigue las instrucciones
```

**Opción B: Vía Web**
1. Ir a https://vercel.com
2. Click "Add New..." → "Project"
3. Importar tu repo de GitHub
4. Click "Import"

### PASO 8: Configurar Variables en Vercel (5 min)

En Vercel → Settings → Environment Variables

Agregar todas las variables de `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GEOAPIFY_API_KEY`
- `NEXT_PUBLIC_APP_URL` = `https://tu-dominio.vercel.app`

### PASO 9: Configurar Dominio nic.cl (5 min)

**En nic.cl:**
1. Ir a "Mis servicios" → Tu dominio
2. Buscar "Nameservers"
3. Cambiar a:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

**En Vercel:**
1. Settings → Domains
2. Agregar tu dominio (ej: `cotizador.tuempresa.cl`)
3. Vercel valida automáticamente
4. Listo (se propaga en 5-15 min)

### PASO 10: Probar en Producción (5 min)

- Ir a tu dominio: `https://cotizador.tuempresa.cl`
- Prueba el flujo completo
- Verifica que las reservas se creen en Supabase

## 🎯 CHECKLIST FINAL

- [ ] Supabase creado
- [ ] Tablas creadas
- [ ] .env.local configurado
- [ ] Funciona en local
- [ ] GitHub repo actualizado
- [ ] Vercel conectado
- [ ] Variables de entorno en Vercel
- [ ] Dominio nic.cl apuntando a Vercel
- [ ] Todo funciona en producción

## 📊 ESTRUCTURA CREADA

```
API Endpoints:
GET    /api/bookings/available          → Horarios disponibles
POST   /api/bookings/create             → Crear reserva
GET    /api/admin/fleet-config          → Ver cantidad de camiones
POST   /api/admin/fleet-config          → Actualizar cantidad de camiones
GET    /api/admin/blocked-slots         → Ver bloques
POST   /api/admin/blocked-slots         → Crear bloque
DELETE /api/admin/blocked-slots/[id]    → Eliminar bloque

BD Supabase:
- fleet_config          (configuración de camiones)
- blocked_slots         (horarios bloqueados)
- bookings              (reservas de clientes)
```

## 🔧 PRÓXIMOS PASOS (OPCIONAL)

1. Panel de Admin para bloquear horarios
2. Sincronización con Google Calendar
3. Emails automáticos con SendGrid
4. WhatsApp automático
5. Dashboard de reservas

## ❓ AYUDA

Si algo falla:
- Verifica que `.env.local` tiene todas las variables
- Revisa que Supabase está configurado
- En terminal: `npm run dev`
- En navegador: `http://localhost:3000`

---

**¿Listo para lanzar? 🚀**

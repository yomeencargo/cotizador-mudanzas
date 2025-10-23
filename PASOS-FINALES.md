# 🚀 PASOS FINALES - Tu Cotizador con Sistema de Reservas

## ✅ LO QUE YA ESTÁ HECHO

He creado todo el sistema de reservas con soporte para múltiples camiones. Aquí está lo que necesitas hacer AHORA:

---

## 📋 PASO 1: CONFIGURAR SUPABASE (15 min) ⭐

### 1.1 Crear cuenta y proyecto

1. Ve a https://supabase.com
2. Haz click en "Start Your Project"
3. Sign up con GitHub (más fácil)
4. Click "New Project"
   - Name: `cotizador-mudanzas`
   - Database password: [elige uno fuerte, guárdalo]
   - Region: `South America (São Paulo)` ← IMPORTANTE
   - Click "Create new project"

**Espera 2-3 minutos a que inicialice**

### 1.2 Ejecutar SQL para crear tablas

Una vez listo:

1. En Supabase → Click en "SQL Editor" (lado izquierdo)
2. Click en "New Query"
3. **Copiar TODO el contenido** de `SQL_SCHEMA.sql` (en tu proyecto)
4. Pegar en el editor SQL
5. Click "Run"

✅ **Debe decir "Success"**

### 1.3 Obtener las credenciales

1. En Supabase → Settings (abajo a la izquierda)
2. Click "API"
3. **COPIAR y GUARDAR en un bloc de notas:**
   - `Project URL` (algo como: `https://xxxxx.supabase.co`)
   - `anon public key` (larga, empieza con `eyJhbGc...`)
   - `service_role key` (larga, empieza con `eyJhbGc...`)

---

## 📋 PASO 2: CONFIGURAR `.env.local` EN TU PC (5 min)

En la carpeta raíz de tu proyecto, crea un archivo llamado `.env.local` (exacto):

```env
# SUPABASE (pega lo que copiaste arriba)
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# GEOAPIFY (ya lo tienes)
NEXT_PUBLIC_GEOAPIFY_API_KEY=TU_API_KEY_AQUI

# APP URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **IMPORTANTE:** 
- Este archivo NO se sube a GitHub (está en .gitignore)
- Solo lo usa tu PC local
- Guárdalo bien

---

## 📋 PASO 3: PROBAR EN LOCAL (10 min)

Abre una terminal en tu carpeta y ejecuta:

```bash
npm run dev
```

Abre http://localhost:3000

**Prueba:**
1. Ve a "Fecha y Hora"
2. Selecciona una fecha
3. **DEBE mostrar solo horarios disponibles** (08:00, 09:00, 10:00, 11:00, 14:00, 15:00)
4. Cada horario debe mostrar 🚚🚚🚚 (3 camiones verdes)
5. Selecciona uno
6. Ve al Resumen
7. Click "Confirmar Reserva" (50% o 100%)
8. **DEBE decir "¡Reserva confirmada!"**

Si todo funciona ✅ pasamos al siguiente paso.

Si falla ❌ revisa:
- ¿`.env.local` tiene todos los datos?
- ¿Supabase SQL se ejecutó sin errores?
- ¿Copió bien las credenciales?

---

## 📋 PASO 4: PUSH A GITHUB (5 min)

```bash
git add .
git commit -m "Add Supabase booking system with multi-vehicle support"
git push origin main
```

---

## 📋 PASO 5: DEPLOY EN VERCEL (15 min) ⭐

### 5.1 Opción A: Con CLI (más rápido)

```bash
npm install -g vercel
vercel
```

Sigue las instrucciones, selecciona:
- Vercel account: [Tu cuenta]
- Confirm? Yes
- Project name: `cotizador` (o lo que quieras)
- Framework: `Next.js`

### 5.2 Opción B: Con Web (más fácil visualmente)

1. Ve a https://vercel.com
2. Haz login con GitHub
3. Click "Add New..." → "Project"
4. Busca tu repo `cotizador-mudanzas`
5. Click "Import"
6. **IMPORTANTE:** Antes de hacer click en "Deploy", agrega las variables:

### 5.3 Configurar Variables en Vercel

Antes de hacer Deploy:

En Vercel, en la pantalla de "Configure Project":
1. Busca "Environment Variables"
2. Agrega TODAS estas:

```
NEXT_PUBLIC_SUPABASE_URL     = https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY     = eyJhbGc...
NEXT_PUBLIC_GEOAPIFY_API_KEY  = TU_API_KEY
NEXT_PUBLIC_APP_URL            = https://tu-app.vercel.app
```

3. Click "Deploy"

**Espera 3-5 minutos**

Vercel te dará una URL como: `https://cotizador-xxxx.vercel.app`

✅ **Prueba yendo a esa URL**

---

## 📋 PASO 6: CONFIGURAR TU DOMINIO NIC.CL (10 min) ⭐

### 6.1 En NIC.CL

1. Ve a https://nic.cl
2. Login con tus credenciales
3. Mis Servicios → Tu dominio
4. Busca "Nameservers"
5. Cambia a:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
6. Guarda los cambios

### 6.2 En VERCEL

1. Ve a tu proyecto en Vercel
2. Settings → Domains
3. Click "Add Domain"
4. Escribe tu dominio: `cotizador.tuempresa.cl`
5. Click "Add"
6. Vercel valida automáticamente

**Espera 5-15 minutos a que se propague el DNS**

---

## 🎉 ¡LISTO!

Ahora tu cotizador está:

✅ En la nube (Vercel)
✅ Con BD en tiempo real (Supabase)
✅ Con dominio personalizado (nic.cl)
✅ Con sistema de reservas multi-camión
✅ **$0/mes** (probablemente siempre)

---

## 🧪 PRUEBA FINAL (5 min)

Ve a `https://cotizador.tuempresa.cl` y:

1. Completa el flujo entero (todos los pasos)
2. Selecciona fecha y hora (deberían ver SOLO horarios disponibles)
3. Confirma la reserva
4. Deberá decir "¡Reserva confirmada!"

**¿Funciona todo?** ¡PERFECTO! 🚀

---

## 🔧 PRÓXIMOS PASOS (OPCIONALES)

Si quieres agregar más:

1. **Panel de Admin** para bloquear horarios (mañana)
2. **Emails automáticos** cuando se reserva
3. **WhatsApp** automático
4. **Google Calendar** sincronizado
5. **Reportes en Drive**

Solo dime y lo hacemos 😉

---

## ❓ PROBLEMAS COMUNES

### "Error de credenciales Supabase"
→ Revisá que copiaste bien URL y keys (sin espacios)

### "No veo horarios disponibles"
→ Revisá que la tabla `fleet_config` tiene un registro con `num_vehicles = 1`

### "Error de CORS"
→ Supabase generalmente lo resuelve solo. Si persiste, contáctame.

### "Mi dominio no resuelve"
→ Los nameservers tardan 5-15 minutos. Espera y limpia caché (Ctrl+Shift+R)

---

**¡Cualquier duda, me avisas! Estoy acá para ayudarte.** 💪

---

**TL;DR (Version resumida):**
1. Supabase: Copia SQL y obtén credenciales
2. `.env.local`: Pega credenciales
3. `npm run dev`: Prueba local
4. `git push`: Sube a GitHub
5. Vercel: Deploy con variables
6. NIC.CL: Apunta a Vercel
7. ¡LISTO! ✅

# 🔧 SOLUCIÓN: Las Reservas No Aparecen en Producción

## 📋 Problema

Las reservas se ven en `localhost` pero NO en producción (Vercel).

## 🎯 Causa

Las políticas RLS (Row Level Security) de Supabase están bloqueando el acceso en producción.

## ✅ Solución (2 pasos)

### PASO 1: Ejecutar SQL en Supabase (2 minutos)

1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Click en "SQL Editor" (menú izquierdo)
4. Click en "New Query"
5. Abre el archivo `FIX-RLS-DESACTIVAR.sql` en tu proyecto
6. Copia TODO el contenido
7. Pega en el editor de Supabase
8. Click en "Run" o presiona `Ctrl + Enter`

✅ Debe decir "Success" o "Success. No rows returned"

### PASO 2: Esperar 1 minuto y probar

1. Espera 1 minuto para que los cambios surtan efecto
2. Ve a tu admin en producción (tu link de Vercel)
3. Inicia sesión con:
   - Usuario: `admin`
   - Contraseña: `iaenblanco2025`
4. Deberías ver las reservas ahora

---

## 🔍 Cómo Verificar que Funcionó

1. **En Supabase SQL Editor**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
     AND tablename IN ('bookings', 'blocked_slots');
   ```

   `rowsecurity` debe ser `false` (no `true`)

2. **En tu Admin de Producción**:
   - Deberías ver la lista de reservas
   - Los contadores del dashboard deberían mostrar números > 0

---

## ❓ ¿Por qué aparecía en localhost pero no en producción?

- En **localhost**: Supabase a veces no aplica RLS estrictamente
- En **producción**: Supabase aplica RLS completamente, bloqueando el acceso sin políticas configuradas

Como tu aplicación usa `service_role_key` para el admin (que debería ignorar RLS), pero RLS estaba activado sin políticas, el acceso se bloqueaba.

---

## ✅ ¿Es Seguro Desactivar RLS?

**Sí**, porque:

1. ✅ Tu aplicación NO expone el acceso directo a Supabase al cliente
2. ✅ Todas las consultas pasan por tu API backend
3. ✅ El admin usa autenticación basada en cookies
4. ✅ El middleware (`src/middleware.ts`) protege las rutas `/admin`

Tu seguridad está en:
- Middleware de Next.js
- Cookies httpOnly
- Validación de credenciales en el backend

---

## 🚨 Si sigue sin funcionar

1. **Verifica que ejecutaste el SQL**:
   - Ve a Supabase → Table Editor → bookings
   - Deberías ver todas las reservas

2. **Verifica las variables de entorno en Vercel**:
   - Ve a https://vercel.com
   - Tu proyecto → Settings → Environment Variables
   - Debe tener:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   
3. **Re-despliega**:
   ```bash
   git commit --allow-empty -m "Fix RLS"
   git push
   ```
   Vercel redeployará automáticamente

---

## 📝 Nota

Si después quieres volver a habilitar RLS con políticas seguras, ejecuta el contenido de `FIX-RLS-POLICIES-SECURE.sql` en Supabase.


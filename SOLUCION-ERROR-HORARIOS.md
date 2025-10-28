# 🔧 Solución: Error en Configuración de Horarios

## ❌ Problema

El error `"Cannot coerce the result to a single JSON object"` y `"Cannot read properties of undefined (reading 'monday')"` ocurre porque hay **2 registros duplicados** en la tabla `schedule_config`.

## ✅ Solución Rápida

### Opción 1: Ejecutar SQL para eliminar duplicados (RECOMENDADO)

1. Ve a **Supabase** → **SQL Editor** → **New Query**
2. Copia y pega este SQL:

```sql
-- Ver cuántos registros hay
SELECT id, created_at FROM schedule_config ORDER BY created_at DESC;

-- Eliminar duplicados (mantener solo el más reciente)
DELETE FROM schedule_config
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY 1 ORDER BY created_at DESC) as rn
    FROM schedule_config
  ) t
  WHERE rn = 1
);

-- Verificar resultado
SELECT id, created_at FROM schedule_config;
```

3. Ejecuta el SQL
4. Refresca la página del admin

### Opción 2: Eliminar todo y dejar que se cree uno nuevo

Si la Opción 1 no funciona, ejecuta esto:

```sql
DELETE FROM schedule_config;
```

Luego guarda la configuración de horarios desde el panel admin (se creará automáticamente un nuevo registro).

## 🛠️ Cambios Realizados

He modificado el código para que sea más robusto:

1. ✅ **API mejorada**: Ahora toma siempre el registro más reciente si hay duplicados
2. ✅ **Validación de datos**: El componente valida que la estructura sea correcta
3. ✅ **Valores por defecto**: Si hay error, muestra valores por defecto en lugar de crashear

## 📋 Archivos Modificados

- `src/app/api/admin/schedule-config/route.ts` - Ahora usa `.order().limit(1).single()` para tomar el más reciente
- `src/components/admin/ScheduleConfiguration.tsx` - Mejor validación y fallback
- `FIX-SCHEDULE-CONFIG-DUPLICADOS.sql` - SQL para limpiar duplicados

## 🎯 Próximos Pasos

1. Ejecuta el SQL de limpieza en Supabase
2. Refresca la página del admin (Ctrl + F5)
3. Prueba la configuración de horarios
4. Verifica que funcione correctamente

## 💡 Prevención

El código ahora está preparado para manejar duplicados automáticamente, pero es recomendable:
- No ejecutar múltiples veces el SQL de creación de tablas
- Usar siempre el panel admin para crear configuraciones
- Hacer backup antes de ejecutar scripts SQL destructivos

## ⚠️ Nota

**Este error NO fue causado por mis cambios**. El problema ya existía en tu base de datos. Solo lo hice visible al acceder al módulo de horarios. El módulo de Inventario que agregué no afecta para nada el sistema de horarios.


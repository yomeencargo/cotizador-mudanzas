# 📦 Gestión de Inventario - Instrucciones

## Funcionalidad Implementada

Se ha implementado un sistema completo de gestión de inventario que permite:
- ✅ **Agregar** nuevos items al catálogo
- ✅ **Editar** items existentes (nombre, categoría, volumen, peso, características)
- ✅ **Eliminar** items del catálogo
- ✅ **Suspender/Activar** items (mostrar/ocultar en el cotizador)
- ✅ **Modificar** m³ y peso de items
- ✅ **Agregar a categorías** (Sala, Comedor, Dormitorio, Electrodomésticos, Oficina, Otros)

## 📋 Paso 1: Crear la Tabla en Supabase

### Instrucciones:

1. **Ve a tu proyecto en Supabase**
   - Accede a [https://supabase.com](https://supabase.com)
   - Ingresa a tu proyecto

2. **Abre el SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"
   - Haz clic en "New query"

3. **Copia y pega el siguiente SQL**
   - Abre el archivo `CREAR-TABLA-CATALOG-ITEMS.sql` que se encuentra en la raíz del proyecto
   - Copia TODO el contenido del archivo

4. **Ejecuta el SQL**
   - Pega el contenido en el editor de SQL de Supabase
   - Haz clic en "Run" o presiona `Ctrl + Enter`
   - Deberías ver el mensaje: ✅ "Success. No rows returned"

5. **Verifica que la tabla se creó**
   - Ve a "Table Editor" en el menú lateral
   - Deberías ver la tabla `catalog_items`
   - Haz clic en ella para ver los items iniciales (más de 30 items ya cargados)

## 🎨 Paso 2: Acceder al Panel de Gestión

1. **Inicia sesión en el panel de administración**
   - Ve a `/admin` en tu aplicación
   - Inicia sesión con tus credenciales de admin

2. **Navega a Configuración → Inventario**
   - En la barra superior, haz clic en "Configuración"
   - Luego haz clic en el tab "Inventario"

3. **¡Listo! Ya puedes gestionar tu inventario**

## 🛠️ Cómo Usar la Gestión de Inventario

### Agregar un Nuevo Item

1. Haz clic en el botón **"Nuevo Item"** (esquina superior derecha)
2. Completa el formulario:
   - **Nombre**: Nombre del item (ej: "Sofá grande")
   - **Categoría**: Selecciona una categoría (Sala, Comedor, etc.)
   - **Emoji/Ícono**: Agrega un emoji para identificarlo (ej: 🛋️)
   - **Volumen**: Volumen en m³ (ej: 2.5)
   - **Peso**: Peso en kg (ej: 80)
   - **Características**: Marca si es frágil, pesado o tiene vidrio
3. Haz clic en **"Crear"**

### Editar un Item Existente

1. Busca el item que quieres editar
2. Haz clic en el botón **"Editar"** del item
3. Modifica los campos que necesites
4. Haz clic en **"Actualizar"**

### Eliminar un Item

1. Busca el item que quieres eliminar
2. Haz clic en el botón de **eliminar** (🗑️)
3. Confirma la eliminación

### Suspender/Activar un Item

1. Busca el item
2. Haz clic en el icono de **ojo** para suspenderlo o **ojo tachado** para activarlo
3. Los items suspendidos NO aparecerán en el cotizador, pero permanecen en la base de datos

### Filtrar Items

- **Por categoría**: Usa los botones de categorías (Sala, Comedor, etc.)
- **Por búsqueda**: Escribe en el buscador para filtrar por nombre

## 📊 Estadísticas

En la parte superior del panel verás:
- **Total Items**: Total de items en el catálogo
- **Items Activos**: Items visibles en el cotizador
- **Items Inactivos**: Items suspendidos
- **Categorías**: Número de categorías únicas

## 🔧 Estructura de la Base de Datos

La tabla `catalog_items` tiene los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `name` | VARCHAR(255) | Nombre del item |
| `category` | VARCHAR(100) | Categoría (Sala, Comedor, etc.) |
| `volume` | DECIMAL(10,4) | Volumen en m³ |
| `weight` | DECIMAL(10,2) | Peso en kg |
| `is_fragile` | BOOLEAN | Es frágil (🔴) |
| `is_heavy` | BOOLEAN | Es pesado (💪) |
| `is_glass` | BOOLEAN | Tiene vidrio (🪟) |
| `image` | VARCHAR(10) | Emoji/ícono |
| `is_active` | BOOLEAN | Está activo (visible) |
| `display_order` | INT | Orden de visualización |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de actualización |

## 🔐 Seguridad (RLS)

El sistema tiene **Row Level Security (RLS)** configurado:
- **Lectura pública**: Cualquiera puede ver items activos
- **Escritura**: Solo administradores pueden modificar items
- Ajusta las políticas en Supabase según tus necesidades

## 📝 Notas Importantes

1. **Los cambios son inmediatos**: Cuando agregas, editas o eliminas items, los cambios se reflejan inmediatamente en el cotizador
2. **Items suspendidos**: Los items con `is_active = false` NO aparecen en el cotizador, pero pueden ser reactivados
3. **Validación**: El sistema valida que volumen y peso sean mayores a 0
4. **Backup**: Es recomendable hacer backup de tu base de datos antes de eliminar muchos items

## 🚀 Funcionalidades Adicionales

### Items Personalizados en el Cotizador

Los usuarios todavía pueden agregar items personalizados en el cotizador (desde el botón "Agregar Item Personalizado"). Estos NO se guardan en la base de datos y son solo para esa cotización específica.

### Categorías Disponibles

Las categorías predefinidas son:
- Sala
- Comedor
- Dormitorio
- Electrodomésticos
- Oficina
- Otros

## 🐛 Solución de Problemas

### No veo los items en el cotizador
- Verifica que la tabla `catalog_items` existe en Supabase
- Verifica que hay items activos (`is_active = TRUE`)
- Revisa la consola del navegador para errores

### No puedo crear items
- Verifica que estás autenticado como admin
- Revisa que la tabla tenga permisos de escritura
- Consulta los logs en Supabase

### Los cambios no se reflejan
- Refresca la página (Ctrl + F5)
- Verifica que los cambios se guardaron en Supabase (ve a Table Editor)

## ✅ Checklist de Implementación

- [x] Tabla `catalog_items` creada en Supabase
- [x] Rutas API para CRUD de items
- [x] Componente de gestión en admin
- [x] Integración con panel de administración
- [x] Catálogo cargado desde Supabase en el cotizador
- [x] Documentación completa

## 🎉 ¡Listo!

Ya puedes gestionar completamente tu inventario desde el panel de administración. Los items ahora son completamente administrables y no requieren cambios de código para agregar o modificar items.


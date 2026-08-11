import { supabaseAdmin } from '@/lib/supabase'
import { getFleetVehicles, type FleetVehicle } from '@/lib/fleetCapacity'
import { resolveVehicleColor, type VehicleColor } from '@/lib/vehicleColors'

// Asignación de reservas a camiones.
//
// Regla de oro: lo asignado a mano manda. El reparto automático solo toca reservas
// FUTURAS que todavía no tienen camión, y una vez que escribe el vehicle_id no lo
// vuelve a mover; si el admin reasigna, esa decisión queda firme.
//
// Todas las lecturas de vehicle_id toleran que la migración add_booking_vehicle_assignment.sql
// no esté aplicada: en ese caso devuelven vacío y la app funciona igual, sin colores.

/** "Hoy" en hora de Chile: el server corre en UTC y de noche cae al día siguiente. */
export function chileTodayString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date())
}

export interface VehicleView {
  id: number
  name: string
  driver: string
  status: 'active' | 'maintenance'
  color: VehicleColor
}

export interface AssignableBooking {
  id: string
  scheduled_date: string
  scheduled_time?: string | null
  is_provisional?: boolean | null
  status?: string | null
}

/** No ocupan camión: pre-reservas sin pagar y trabajos que no se van a hacer. */
function isRealJob(b: AssignableBooking): boolean {
  return !b.is_provisional && !['cancelled', 'no_show'].includes(b.status || '')
}

/** La flota con su color ya resuelto, en el orden en que está configurada. */
export async function getFleetVehicleViews(): Promise<VehicleView[]> {
  const { data } = await supabaseAdmin.from('fleet_config').select('*').single()
  return getFleetVehicles(data).map((v: FleetVehicle, i) => ({
    id: v.id,
    name: v.name || `Camión ${i + 1}`,
    driver: v.driver || '',
    status: v.status === 'maintenance' ? 'maintenance' : 'active',
    color: resolveVehicleColor(v, i),
  }))
}

/** Asignaciones de un rango de fechas: id de reserva → id de camión. */
export async function getVehicleAssignmentsInRange(
  from: string,
  to: string
): Promise<Map<string, number>> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, vehicle_id')
    .gte('scheduled_date', from)
    .lte('scheduled_date', to)

  if (error) {
    console.error('[vehicleAssignment] No se pudo leer vehicle_id (¿falta la migración?):', error.message)
    return new Map()
  }
  return toAssignmentMap(data)
}

/** Todas las asignaciones existentes (para la tabla del admin, que muestra el histórico). */
export async function getAllVehicleAssignments(): Promise<Map<string, number>> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, vehicle_id')
    .not('vehicle_id', 'is', null)

  if (error) {
    console.error('[vehicleAssignment] No se pudo leer vehicle_id (¿falta la migración?):', error.message)
    return new Map()
  }
  return toAssignmentMap(data)
}

function toAssignmentMap(rows: unknown): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of (rows as Array<{ id?: string; vehicle_id?: number | null }>) || []) {
    if (row?.id && typeof row.vehicle_id === 'number') map.set(row.id, row.vehicle_id)
  }
  return map
}

/**
 * Reparte entre los camiones activos las reservas futuras que aún no tienen camión y
 * persiste el resultado. Devuelve el mapa completo (lo que ya había + lo nuevo).
 *
 * El reparto equilibra por carga del día: cada trabajo va al camión activo con menos
 * trabajos ese día, en orden de hora. No se usa `capacity` como tope duro porque un
 * trabajo sin camión asignado es peor que un camión con un trabajo de más: el admin
 * corrige a mano, pero nunca se queda algo fuera de la vista de los choferes.
 */
export async function ensureVehicleAssignments(
  bookings: AssignableBooking[],
  vehicles: VehicleView[],
  existing: Map<string, number>
): Promise<Map<string, number>> {
  const active = vehicles.filter((v) => v.status === 'active')
  if (active.length === 0) return existing

  const today = chileTodayString()
  const activeIds = new Set(active.map((v) => v.id))

  // Solo trabajos reales de hoy en adelante. El pasado se deja como está: reasignar
  // retroactivamente no sirve a nadie y sería una escritura masiva la primera vez.
  const relevant = bookings.filter((b) => b.scheduled_date >= today && isRealJob(b))
  const pending = relevant.filter((b) => {
    const assigned = existing.get(b.id)
    // Se reasigna también lo que apunta a un camión que ya no existe o está en
    // mantenimiento: si no, esos trabajos quedarían huérfanos en la vista.
    return assigned === undefined || !activeIds.has(assigned)
  })
  if (pending.length === 0) return existing

  // Carga inicial por camión y por día, contando lo que ya está asignado.
  const loads = new Map<string, Map<number, number>>()
  const loadFor = (date: string) => {
    let byVehicle = loads.get(date)
    if (!byVehicle) {
      byVehicle = new Map(active.map((v) => [v.id, 0]))
      for (const b of relevant) {
        if (b.scheduled_date !== date) continue
        const assigned = existing.get(b.id)
        if (assigned !== undefined && byVehicle.has(assigned)) {
          byVehicle.set(assigned, (byVehicle.get(assigned) || 0) + 1)
        }
      }
      loads.set(date, byVehicle)
    }
    return byVehicle
  }

  // Orden estable: mismo input, mismo reparto, aunque dos pestañas lo calculen a la vez.
  const ordered = [...pending].sort((a, b) => {
    if (a.scheduled_date !== b.scheduled_date) return a.scheduled_date < b.scheduled_date ? -1 : 1
    const at = a.scheduled_time || ''
    const bt = b.scheduled_time || ''
    if (at !== bt) return at < bt ? -1 : 1
    return a.id < b.id ? -1 : 1
  })

  const writes: Array<{ id: string; vehicle_id: number }> = []

  for (const booking of ordered) {
    const byVehicle = loadFor(booking.scheduled_date)
    let pick = active[0]
    for (const v of active) {
      if ((byVehicle.get(v.id) || 0) < (byVehicle.get(pick.id) || 0)) pick = v
    }
    byVehicle.set(pick.id, (byVehicle.get(pick.id) || 0) + 1)
    writes.push({ id: booking.id, vehicle_id: pick.id })
  }

  const saved = await Promise.all(
    writes.map(async (w) => {
      const { error } = await supabaseAdmin
        .from('bookings')
        .update({ vehicle_id: w.vehicle_id })
        .eq('id', w.id)
      if (error) {
        console.error('[vehicleAssignment] No se pudo asignar camión a', w.id, error.message)
        return null
      }
      return w
    })
  )

  // Solo se refleja lo que quedó realmente escrito: si la migración no está aplicada,
  // esto devuelve el mapa original en vez de un color que la BD no conoce.
  const result = new Map(existing)
  for (const w of saved) {
    if (w) result.set(w.id, w.vehicle_id)
  }
  return result
}

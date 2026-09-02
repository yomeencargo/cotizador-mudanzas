import { cookies } from 'next/headers'
import { getUpcomingDriverJobs, DRIVER_WINDOW_DAYS, type DriverJob } from '@/lib/driverJobs'
import { resolveDriverAccess } from '@/lib/driverAccess'
import { driverSessionCookieName, verifyDriverSessionToken } from '@/lib/driverSession'
import DriverPinGate from '@/components/trabajos/DriverPinGate'
import DriverJobNotes from '@/components/trabajos/DriverJobNotes'
import { getDriverNotesFor, type DriverNote } from '@/lib/driverNotes'
import { formatStopAddress } from '@/lib/stops'
import { formatParkingDistance } from '@/lib/utils'
import { UNASSIGNED_COLOR, type VehicleColor } from '@/lib/vehicleColors'
import type { VehicleView } from '@/lib/vehicleAssignment'

export const dynamic = 'force-dynamic'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function dateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function floorLine(floor: number | null, elevator: boolean | null, parking: number | null): string | null {
  const parts: string[] = []
  if (floor !== null && floor !== undefined) parts.push(`Piso ${floor}`)
  if (elevator !== null && elevator !== undefined) parts.push(elevator ? 'con ascensor' : 'sin ascensor')
  const parkingLabel = formatParkingDistance(parking ?? undefined)
  if (parkingLabel) parts.push(`acarreo: ${parkingLabel}`)
  return parts.length ? parts.join(' · ') : null
}

function AddressBlock({
  label,
  address,
  floor,
  elevator,
  parking,
}: {
  label: string
  address: string
  floor?: number | null
  elevator?: boolean | null
  parking?: number | null
}) {
  if (!address) return null
  const meta = floorLine(floor ?? null, elevator ?? null, parking ?? null)
  return (
    <div className="mt-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <a
        href={mapsUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-blue-700 underline underline-offset-2"
      >
        {address}
      </a>
      {meta && <div className="text-xs text-gray-500">{meta}</div>}
    </div>
  )
}

function JobCard({
  job,
  color,
  token,
  notes,
}: {
  job: DriverJob
  color: VehicleColor
  token: string
  notes: DriverNote[]
}) {
  const isDomicilio = job.booking_type === 'domicilio'
  return (
    <div
      className="rounded-xl border border-l-4 border-gray-200 bg-white p-4 shadow-sm"
      style={{ borderLeftColor: color.hex }}
    >
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-gray-900">
          {job.scheduled_time ? job.scheduled_time.slice(0, 5) : 'Sin hora'} hrs
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isDomicilio
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {isDomicilio ? 'Visita a domicilio' : 'Mudanza'}
        </span>
      </div>

      <div className="mt-1 text-sm font-medium text-gray-900">{job.client_name}</div>
      {job.client_phone && (
        <a href={`tel:${job.client_phone}`} className="text-sm text-blue-700 underline underline-offset-2">
          {job.client_phone}
        </a>
      )}

      {isDomicilio && job.visit_address ? (
        <AddressBlock label="Dirección" address={job.visit_address} />
      ) : (
        <>
          <AddressBlock
            label="Origen"
            address={job.origin_address}
            floor={job.origin_floor}
            elevator={job.origin_has_elevator}
            parking={job.origin_parking_distance}
          />
          {job.stops.length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {job.stops.length === 1 ? 'Parada en el camino' : 'Paradas en el camino'}
              </div>
              <ol className="mt-1 space-y-1.5">
                {job.stops.map((parada, i) => (
                  <li key={i} className="border-l-2 border-amber-300 pl-2">
                    <a
                      href={mapsUrl(formatStopAddress(parada))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-700 underline underline-offset-2"
                    >
                      {i + 1}. {formatStopAddress(parada)}
                    </a>
                    {parada.note && (
                      <div className="text-xs text-amber-800">{parada.note}</div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <AddressBlock
            label="Destino"
            address={job.destination_address}
            floor={job.destination_floor}
            elevator={job.destination_has_elevator}
            parking={job.destination_parking_distance}
          />
        </>
      )}

      {job.items.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Items</div>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {job.items.map((it, i) => (
              <li key={i} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {it.quantity}× {it.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {job.notes && (
        <div className="mt-3 whitespace-pre-line rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span className="font-semibold">Notas: </span>
          {job.notes}
        </div>
      )}

      {/* Lo que el chofer escribe DESPUÉS del trabajo. Va aparte de la nota de arriba,
          que es la que dejó el admin antes y el chofer no puede tocar. */}
      <DriverJobNotes token={token} bookingId={job.id} initialNotes={notes} />
    </div>
  )
}

interface VehicleGroup {
  key: string
  label: string
  color: VehicleColor
  items: DriverJob[]
}

/**
 * Día → camión. Los camiones van en el orden de la flota y "Sin asignar" siempre al
 * final: si un trabajo todavía no tiene camión, tiene que saltar a la vista, no
 * esconderse entre medio.
 */
function groupByDateAndVehicle(
  jobs: DriverJob[],
  vehicles: VehicleView[]
): Array<{ date: string; vehicleGroups: VehicleGroup[] }> {
  const byId = new Map(vehicles.map((v) => [v.id, v]))
  const order = new Map(vehicles.map((v, i) => [v.id, i]))
  const dates: string[] = []
  const byDate = new Map<string, Map<string, VehicleGroup>>()

  for (const job of jobs) {
    if (!byDate.has(job.scheduled_date)) {
      byDate.set(job.scheduled_date, new Map())
      dates.push(job.scheduled_date)
    }
    const vehicle = job.vehicle_id !== null ? byId.get(job.vehicle_id) : undefined
    const key = vehicle ? String(vehicle.id) : 'sin-asignar'
    const groupsOfDay = byDate.get(job.scheduled_date)!

    if (!groupsOfDay.has(key)) {
      groupsOfDay.set(key, {
        key,
        label: vehicle
          ? vehicle.driver
            ? `${vehicle.name} · ${vehicle.driver}`
            : vehicle.name
          : 'Sin asignar',
        color: vehicle ? vehicle.color : UNASSIGNED_COLOR,
        items: [],
      })
    }
    groupsOfDay.get(key)!.items.push(job)
  }

  return dates.map((date) => ({
    date,
    vehicleGroups: [...byDate.get(date)!.values()].sort((a, b) => {
      const ai = a.key === 'sin-asignar' ? Number.MAX_SAFE_INTEGER : order.get(Number(a.key)) ?? 0
      const bi = b.key === 'sin-asignar' ? Number.MAX_SAFE_INTEGER : order.get(Number(b.key)) ?? 0
      return ai - bi
    }),
  }))
}

export default async function DriverJobsPage({ params }: { params: { token: string } }) {
  // El token dice a QUÉ da acceso: a un camión (link nuevo) o a todo (link general
  // heredado). De ahí sale también el PIN que hay que exigir y el scope de la sesión.
  const access = await resolveDriverAccess(params.token)

  if (!access) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">Enlace no válido</h1>
          <p className="mt-1 text-sm text-gray-600">
            Este link de trabajos no es válido o fue reemplazado. Pedile el link actualizado al
            administrador.
          </p>
        </div>
      </div>
    )
  }

  // Segunda capa: además del link con token, hay que ingresar el PIN. La sesión vive
  // en una cookie firmada (12h), así que no se pide en cada carga durante la jornada.
  // Se valida contra el scope de ESTE link: la sesión de un camión no abre la de otro.
  const pinOk = await verifyDriverSessionToken(
    cookies().get(driverSessionCookieName(access.scope))?.value,
    access.scope
  )
  if (!pinOk) {
    return <DriverPinGate token={params.token} label={access.label} />
  }

  const { jobs, vehicles } = await getUpcomingDriverJobs(access.vehicleId)

  // Todas las notas de los trabajos visibles en una sola consulta, para no hacer una por
  // tarjeta. Sin la migración aplicada devuelve vacío y la agenda funciona igual.
  const notesByBooking = await getDriverNotesFor(jobs.map((j) => j.id))

  // Agrupar por fecha y, dentro de cada día, por camión. El orden de los camiones es el
  // de la flota (no el de aparición) para que la lista se lea igual todos los días.
  const groups = groupByDateAndVehicle(jobs, vehicles)

  // Leyenda: los camiones activos más, si hace falta, el gris de "Sin asignar". Sirve
  // para que cada chofer reconozca su color de un vistazo aunque hoy no tenga trabajos.
  const legend: Array<{ label: string; color: VehicleColor }> = vehicles
    .filter((v) => v.status === 'active')
    .map((v) => ({ label: v.driver ? `${v.name} · ${v.driver}` : v.name, color: v.color }))
  if (jobs.some((j) => !j.vehicle_id)) {
    legend.push({ label: 'Sin asignar', color: UNASSIGNED_COLOR })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-6">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Trabajos por hacer</h1>
          <p className="text-sm text-gray-500">
            {access.label} · próximos {DRIVER_WINDOW_DAYS} días
          </p>

          {legend.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {legend.map((entry) => (
                <span
                  key={entry.color.key + entry.label}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: entry.color.soft, color: entry.color.ink }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color.hex }}
                    aria-hidden
                  />
                  {entry.label}
                </span>
              ))}
            </div>
          )}
        </header>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-600">
              {access.kind === 'vehicle'
                ? `No hay trabajos asignados a este camión en los próximos ${DRIVER_WINDOW_DAYS} días.`
                : `No hay trabajos programados en los próximos ${DRIVER_WINDOW_DAYS} días.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.date}>
                <h2 className="mb-2 text-sm font-semibold capitalize text-gray-500">
                  {dateLabel(group.date)}
                </h2>
                <div className="space-y-4">
                  {group.vehicleGroups.map((vg) => (
                    <div key={vg.key}>
                      <div
                        className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: vg.color.hex }}
                      >
                        <span>{vg.label}</span>
                        <span className="font-semibold opacity-90">
                          {vg.items.length} {vg.items.length === 1 ? 'trabajo' : 'trabajos'}
                        </span>
                      </div>
                      <div className="mt-2 space-y-3">
                        {vg.items.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            color={vg.color}
                            token={params.token}
                            notes={notesByBooking.get(job.id) || []}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-8 text-center text-[11px] text-gray-400">
          Actualizá la página para ver los últimos trabajos.
        </footer>
      </div>
    </div>
  )
}

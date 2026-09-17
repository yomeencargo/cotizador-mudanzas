/**
 * Lee TODAS las filas de una consulta de Supabase, de a páginas.
 *
 * PostgREST corta cada respuesta en 1.000 filas (el `max-rows` del proyecto) sin avisar:
 * la consulta no falla, simplemente devuelve menos. Así fue como el panel de Prospectos
 * dejó de mostrar los leads más antiguos cuando la tabla pasó de 1.000 filas (medido el
 * 15-sep-2026: 931 de 1.021 visibles).
 *
 * `page(from, to)` tiene que armar la consulta con un orden ESTABLE (con desempate por
 * `id`); si no, entre una página y la siguiente las filas pueden reordenarse y aparecer
 * repetidas o saltarse.
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  pageSize = 1000
): Promise<{ data: T[]; error: any }> {
  const rows: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1)
    if (error) return { data: rows, error }
    const batch = data || []
    rows.push(...batch)
    if (batch.length < pageSize) return { data: rows, error: null }
  }
}

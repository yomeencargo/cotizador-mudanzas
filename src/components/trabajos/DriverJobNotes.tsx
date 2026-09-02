'use client'

import { useState } from 'react'
import { DRIVER_NOTE_MAX_LENGTH, type DriverNote } from '@/lib/driverNotes'

interface DriverJobNotesProps {
  token: string
  bookingId: string
  initialNotes: DriverNote[]
}

function horaCorta(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Notas del trabajo realizado, escritas por el chofer desde su link.
 *
 * Se agregan, no se editan: en un camión puede haber más de una persona y en un trabajo
 * pasan varias cosas. Un campo editable haría que el segundo en escribir pise al primero.
 */
export default function DriverJobNotes({ token, bookingId, initialNotes }: DriverJobNotesProps) {
  const [notes, setNotes] = useState<DriverNote[]>(initialNotes)
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const guardar = async () => {
    const limpio = texto.trim()
    if (!limpio || guardando) return
    setGuardando(true)
    setError('')
    try {
      const res = await fetch('/api/trabajos/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, bookingId, note: limpio }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.note) {
        throw new Error(data?.error || 'No se pudo guardar')
      }
      setNotes((prev) => [...prev, data.note as DriverNote])
      setTexto('')
      setAbierto(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {notes.length > 0 && (
        <ul className="mb-2 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="whitespace-pre-line text-xs text-slate-800">{n.note}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {horaCorta(n.created_at)}
                {n.vehicle_label ? ` · ${n.vehicle_label}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      {abierto ? (
        <div>
          <textarea
            autoFocus
            rows={3}
            value={texto}
            maxLength={DRIVER_NOTE_MAX_LENGTH}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Qué pasó en el trabajo…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          {error && (
            <p className="mt-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || !texto.trim()}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar nota'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAbierto(false)
                setTexto('')
                setError('')
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="text-xs font-semibold text-blue-700 underline underline-offset-2"
        >
          {notes.length > 0 ? '+ Agregar otra nota' : '+ Agregar nota del trabajo'}
        </button>
      )}
    </div>
  )
}

import type { NextRequest } from 'next/server'
import { ENV_ADMIN_ID } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'

export type AdminRole = 'administrator' | 'staff'

export function normalizeAdminRole(value: unknown): AdminRole {
  return value === 'administrator' ? 'administrator' : 'staff'
}

/**
 * Resuelve el rol exclusivamente desde la identidad firmada que inyecta el middleware.
 * Nunca acepta un rol enviado por el navegador.
 */
export async function getAdminRole(request: NextRequest): Promise<AdminRole> {
  const userId = request.headers.get('x-admin-user-id') || ''
  if (userId === ENV_ADMIN_ID) return 'administrator'
  if (!userId) return 'staff'

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  // Antes de aplicar la migración la columna no existe. El fallback seguro es staff:
  // la operación diaria sigue viva, pero nadie recibe privilegios financieros por error.
  if (error) {
    console.error('[adminPermissions] No se pudo resolver el rol:', error.message)
    return 'staff'
  }

  return normalizeAdminRole(data?.role)
}

export async function isAdministrator(request: NextRequest): Promise<boolean> {
  return (await getAdminRole(request)) === 'administrator'
}

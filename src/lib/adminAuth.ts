import { timingSafeEqual } from 'crypto'

const DEFAULT_ADMIN_USERNAME = 'admin'

function safeEqualString(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8')
    const bufB = Buffer.from(b, 'utf8')
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0)
}

export function validateAdminCredentials(username: string, password: string): boolean {
  const expectedUser =
    process.env.ADMIN_USERNAME?.trim() || DEFAULT_ADMIN_USERNAME
  const expectedPass = process.env.ADMIN_PASSWORD

  if (!expectedPass) return false

  return (
    safeEqualString(username.trim(), expectedUser) &&
    safeEqualString(password, expectedPass)
  )
}

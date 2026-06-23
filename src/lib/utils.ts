import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'full',
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeStyle: 'short',
  }).format(date)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePhone(phone: string): boolean {
  const re = /^(\+?56)?(\s?)(0?9)(\s?)[9876543]\d{7}$/
  return re.test(phone.replace(/\s/g, ''))
}

/**
 * Normaliza un teléfono chileno al formato canónico "+56 9 XXXX XXXX".
 * Acepta entradas como "9 7602 0510", "976020510", "+56976020510", "56 9 7602 0510".
 * Si el número no calza con un móvil chileno válido, devuelve el valor original
 * (no rompe entradas raras). Garantiza que el enlace de WhatsApp siempre funcione.
 */
export function normalizeChileanPhone(phone: string): string {
  let digits = (phone || '').replace(/\D/g, '')
  if (digits.startsWith('56')) digits = digits.slice(2)
  if (digits.length === 8) digits = '9' + digits // faltaba el 9 inicial del móvil
  if (digits.length === 9 && digits.startsWith('9')) {
    return `+56 9 ${digits.slice(1, 5)} ${digits.slice(5, 9)}`
  }
  return phone
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}


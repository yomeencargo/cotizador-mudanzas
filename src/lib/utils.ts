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

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}


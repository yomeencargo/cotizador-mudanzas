import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Solo aplicar middleware a rutas de admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Si es la página de login, permitir acceso
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Verificar si hay token de autenticación en las cookies
    const isAuthenticated = request.cookies.get('admin_authenticated')?.value === 'true'
    
    if (!isAuthenticated) {
      // Redirigir al login si no está autenticado
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}

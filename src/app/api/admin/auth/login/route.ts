import { NextRequest, NextResponse } from 'next/server'
import {
  isAdminAuthConfigured,
  validateAdminCredentials
} from '@/lib/adminAuth'

export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthConfigured()) {
      console.error(
        '[admin/auth] Falta ADMIN_PASSWORD en variables de entorno'
      )
      return NextResponse.json(
        {
          error:
            'El acceso de administrador no está configurado. Define ADMIN_PASSWORD en el servidor.'
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { username, password } = body

    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    if (!validateAdminCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      success: true,
      message: 'Acceso autorizado'
    })

    const isSecure = request.url.startsWith('https://')

    response.cookies.set('admin_authenticated', 'true', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/'
    })

    response.cookies.set('admin_login_time', Date.now().toString(), {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error in login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

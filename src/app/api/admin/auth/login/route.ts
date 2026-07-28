import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin, isAdminAuthConfigured } from '@/lib/adminAuth'
import { createSessionToken } from '@/lib/adminSession'

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

    const user = await authenticateAdmin(username, password)

    if (!user) {
      // Mismo mensaje siempre: no revelamos si falló el usuario o la contraseña.
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      success: true,
      message: 'Acceso autorizado',
      user: {
        username: user.username,
        displayName: user.displayName,
        mustChangePassword: user.mustChangePassword,
      },
    })

    const isSecure = request.url.startsWith('https://')

    // Cookie de sesión firmada (HMAC) con la identidad del usuario.
    const sessionToken = await createSessionToken({
      id: user.id,
      username: user.username,
    })

    response.cookies.set('admin_authenticated', sessionToken, {
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

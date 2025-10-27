import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validar credenciales
    if (username === 'admin' && password === 'iaenblanco2025') {
      // Crear respuesta con cookie de autenticación
      const response = NextResponse.json({
        success: true,
        message: 'Acceso autorizado'
      })

      // Establecer cookie de autenticación (expira en 24 horas)
      // Usar secure: true solo si estamos en HTTPS
      const isSecure = request.url.startsWith('https://')
      
      response.cookies.set('admin_authenticated', 'true', {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 horas
        path: '/'
      })

      // Cookie adicional con timestamp para control de sesión
      response.cookies.set('admin_login_time', Date.now().toString(), {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 horas
        path: '/'
      })

      return response
    } else {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

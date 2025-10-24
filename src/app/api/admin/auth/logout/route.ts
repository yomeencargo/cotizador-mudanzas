import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Crear respuesta de logout
    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    })

    // Eliminar cookies de autenticación
    response.cookies.set('admin_authenticated', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Expirar inmediatamente
    })

    response.cookies.set('admin_login_time', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Expirar inmediatamente
    })

    return response
  } catch (error) {
    console.error('Error in logout:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}

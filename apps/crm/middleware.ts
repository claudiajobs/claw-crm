import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = ['/login', '/signup', '/pending']

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const pathname = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isApi = pathname.startsWith('/api/')

  // API routes handled by their own middleware (sdr-middleware)
  if (isApi) return supabaseResponse

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check user status for authenticated users on dashboard pages
  if (user && !isPublic) {
    // Create a lightweight supabase client to check user status
    const response = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { data: profile } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single()

    if (profile && (profile.status === 'pending' || profile.status === 'suspended')) {
      const pendingUrl = request.nextUrl.clone()
      pendingUrl.pathname = '/pending'
      return NextResponse.redirect(pendingUrl)
    }
  }

  // Redirect authenticated active users away from public pages to dashboard
  if (user && isPublic && pathname !== '/pending') {
    // Check if user is pending first
    const response = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { data: profile } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single()

    if (profile?.status === 'active') {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/contacts'
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

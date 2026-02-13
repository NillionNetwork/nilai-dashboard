/**
 * Route handler wrappers for authentication and authorization
 * These wrappers eliminate code duplication across API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from './privy-server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from './credit-service'

export type AuthClaims = Awaited<ReturnType<typeof getAuthenticatedUser>>

/**
 * Basic auth wrapper - just verifies the user is authenticated
 */
export function withAuth(
  handler: (request: NextRequest, claims: NonNullable<AuthClaims>) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const claims = await getAuthenticatedUser(request)
      if (!claims) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return handler(request, claims)
    } catch (error) {
      console.error('Error in authenticated route:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Auth wrapper that verifies userId from route params matches authenticated user
 */
export function withAuthAndUserId(
  handler: (
    request: NextRequest,
    claims: NonNullable<AuthClaims>,
    userId: string,
    params: Promise<{ userId: string }>
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, { params }: { params: Promise<{ userId: string }> }) => {
    try {
      const claims = await getAuthenticatedUser(request)
      if (!claims) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { userId } = await params
      if (!userId) {
        return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
      }

      if (claims.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return handler(request, claims, userId, params)
    } catch (error) {
      console.error('Error in authenticated route:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Auth wrapper that verifies userId from request body matches authenticated user
 */
export function withAuthAndUserIdFromBody(
  handler: (
    request: NextRequest,
    claims: NonNullable<AuthClaims>,
    body: any
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const claims = await getAuthenticatedUser(request)
      if (!claims) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body = await request.json()
      const user_id = body.user_id

      if (!user_id) {
        return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
      }

      if (claims.userId !== user_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return handler(request, claims, body)
    } catch (error) {
      console.error('Error in authenticated route:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Helper function to verify credential ownership
 */
async function verifyCredentialOwnership(
  credentialId: string,
  userId: string
): Promise<{ owns: boolean; credential?: any; notFound?: boolean }> {
  try {
    const response = await fetch(`${CREDIT_SERVICE_URL}credential/${credentialId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
      },
    })

    if (!response.ok) {
      return { owns: false, notFound: response.status === 404 }
    }

    const credential = await response.json()
    return {
      owns: credential.user_id === userId,
      credential,
    }
  } catch {
    return { owns: false }
  }
}

/**
 * Auth wrapper that verifies credential ownership
 */
export function withAuthAndCredentialOwnership(
  handler: (
    request: NextRequest,
    claims: NonNullable<AuthClaims>,
    credentialId: string,
    params: Promise<{ credentialId: string }>
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<{ credentialId: string }> }
  ) => {
    try {
      const claims = await getAuthenticatedUser(request)
      if (!claims) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { credentialId } = await params
      if (!credentialId) {
        return NextResponse.json({ error: 'credential_id is required' }, { status: 400 })
      }

      const { owns, notFound } = await verifyCredentialOwnership(credentialId, claims.userId)
      if (notFound) {
        return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
      }
      if (!owns) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return handler(request, claims, credentialId, params)
    } catch (error) {
      console.error('Error in authenticated route:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Auth wrapper for routes that use userId from query params
 */
export function withAuthAndUserIdFromQuery(
  handler: (
    request: NextRequest,
    claims: NonNullable<AuthClaims>,
    userId: string
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const claims = await getAuthenticatedUser(request)
      if (!claims) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const searchParams = request.nextUrl.searchParams
      const userId = searchParams.get('user_id')

      if (!userId) {
        return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
      }

      if (claims.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return handler(request, claims, userId)
    } catch (error) {
      console.error('Error in authenticated route:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

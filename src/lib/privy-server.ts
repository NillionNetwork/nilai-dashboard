/**
 * Server-side Privy utilities
 * Use this for API routes or server components that need to verify tokens
 */

import { PrivyClient } from '@privy-io/node'

let privyClient: PrivyClient | null = null

export function getPrivyClient(): PrivyClient {
  if (!privyClient) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
    const appSecret = process.env.PRIVY_APP_SECRET
    if (!appId) {
      throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is not set in environment variables')
    }
    if (!appSecret) {
      throw new Error('PRIVY_APP_SECRET is not set in environment variables')
    }
    privyClient = new PrivyClient({
      appId,
      appSecret,
    })
  }
  return privyClient
}

/**
 * Verify a Privy access token (for use in API routes)
 * @param token - The access token from the client
 * @returns The verified user data or null if invalid
 */
export async function verifyPrivyToken(token: string) {
  try {
    const client = getPrivyClient()
    return await client.utils().auth().verifyAccessToken(token)
  } catch (error) {
    console.error('Error verifying Privy token:', error)
    return null
  }
}

/**
 * Extract and verify Privy token from Next.js request
 * @param request - Next.js request object
 * @returns The verified claims or null if invalid/missing
 */
export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.replace('Bearer ', '')
  const claims = await verifyPrivyToken(token)
  
  if (!claims) {
    return null
  }
  
  // Normalize userId - Privy's verifyAccessToken returns userId property
  // but JWT has 'sub' claim, so check both
  const claimsAny = claims as any
  const userId = claimsAny.userId || claimsAny.sub || claimsAny.user_id
  
  if (!userId) {
    return null
  }
  
  // Return normalized claims with userId always present
  return {
    ...claims,
    userId,
  } as typeof claims & { userId: string }
}


/**
 * Server-side Privy utilities
 * Use this for API routes or server components that need to verify tokens
 */

import { PrivyClient } from '@privy-io/server-auth'

let privyClient: PrivyClient | null = null

export function getPrivyClient(): PrivyClient {
  if (!privyClient) {
    const appSecret = process.env.PRIVY_APP_SECRET
    if (!appSecret) {
      throw new Error('PRIVY_APP_SECRET is not set in environment variables')
    }
    privyClient = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID || '', appSecret)
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
    const claims = await client.verifyAuthToken(token)
    return claims
  } catch (error) {
    console.error('Error verifying Privy token:', error)
    return null
  }
}


/**
 * Usage API Route - DISABLED
 * 
 * This API route has been disabled but kept for future reference.
 * The route is disabled by renaming the folder to _usage (Next.js ignores folders starting with underscore).
 * To re-enable: rename _usage back to usage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Fetch user's credentials to get an API key
    const credentialsResponse = await fetch(`${CREDIT_SERVICE_URL}credential/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
      },
    })

    if (!credentialsResponse.ok) {
      const errorText = await credentialsResponse.text()
      console.error('Credential service error:', credentialsResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch credentials' },
        { status: credentialsResponse.status }
      )
    }

    const credentialsData = await credentialsResponse.json()
    const credentials = credentialsData.credentials || []

    // Filter out DIDs and get only API keys (not starting with did:key:)
    const apiKeys = credentials.filter(c => !c.credential_key.startsWith('did:key:'))

    // Check if user has any API keys (excluding DIDs)
    if (apiKeys.length === 0) {
      return NextResponse.json(
        { 
          error: 'No API keys found. Please create an API key first to view usage statistics.',
          requiresApiKey: true 
        },
        { status: 400 }
      )
    }

    // Use the first API key (not a DID) as the bearer token
    const bearerToken = apiKeys[0].credential_key
    const usageInstanceUrl = process.env.NILAI_INSTANCE_FOR_USAGE_STATS || 'https://credit.nilai.sandbox.nilogy.xyz/'

    // Make request to the usage service
    const response = await fetch(`${usageInstanceUrl}v1/usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Usage service error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching usage data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


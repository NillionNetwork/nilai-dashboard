import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, credential_key, is_public } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    if (!credential_key) {
      return NextResponse.json(
        { error: 'credential_key is required' },
        { status: 400 }
      )
    }

    // Make request to the credential service
    const response = await fetch(`${CREDIT_SERVICE_URL}credential`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
      },
      body: JSON.stringify({
        user_id,
        credential_key,
        is_public: is_public ?? false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Credential service error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to create credential' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error creating credential:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


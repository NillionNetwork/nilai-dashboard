import { NextRequest, NextResponse } from 'next/server'

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

    const creditToken = process.env.NILAUTH_CREDIT_TOKEN
    if (!creditToken) {
      console.error('NILAUTH_CREDIT_TOKEN is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Make request to the credential service
    const response = await fetch('http://localhost:3030/v1/credential', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${creditToken}`,
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


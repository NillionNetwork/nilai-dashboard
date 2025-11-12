import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
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

    // Make request to the credit service
    const response = await fetch('http://localhost:3030/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${creditToken}`,
      },
      body: JSON.stringify({
        user_id,
        balance: 0,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Credit service error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to create user in credit service' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


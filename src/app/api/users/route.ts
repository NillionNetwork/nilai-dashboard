import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'

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

    // Make request to the credit service
    const response = await fetch(`${CREDIT_SERVICE_URL}users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
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


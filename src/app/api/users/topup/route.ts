import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, amount } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    // Make request to the credit service
    const response = await fetch(`${CREDIT_SERVICE_URL}users/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
      },
      body: JSON.stringify({
        user_id,
        amount,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Credit service error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to top up credits' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error topping up credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'
import { withAuthAndUserIdFromBody } from '@/lib/api-wrapper'

export const POST = withAuthAndUserIdFromBody(async (request, claims, body) => {
  const { user_id, amount } = body

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
})


import { NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'
import { withAuthAndUserId } from '@/lib/api-wrapper'

export const GET = withAuthAndUserId(async (request, claims, userId) => {
  // Make request to the credit service
  const response = await fetch(`${CREDIT_SERVICE_URL}users/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Credit service error:', response.status, errorText)
    return NextResponse.json(
      { error: 'Failed to fetch user credits' },
      { status: response.status }
    )
  }

  const data = await response.json()
  return NextResponse.json(data, { status: 200 })
})


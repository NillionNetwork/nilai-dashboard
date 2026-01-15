import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

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
  } catch (error) {
    console.error('Error fetching user credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


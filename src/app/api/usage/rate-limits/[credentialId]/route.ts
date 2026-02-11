import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> }
) {
  try {
    const { credentialId } = await params

    if (!credentialId) {
      return NextResponse.json(
        { error: 'credential_id is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${CREDIT_SERVICE_URL}credential/${credentialId}/rate-limits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Rate limits service error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch rate limits' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching rate limits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ credentialId: string }> }
) {
  try {
    const { credentialId } = await params
    const body = await request.json()

    if (!credentialId) {
      return NextResponse.json(
        { error: 'credential_id is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${CREDIT_SERVICE_URL}credential/${credentialId}/rate-limits`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Rate limits service error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to update rate limits' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error updating rate limits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

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

    const creditToken = process.env.NILAUTH_CREDIT_TOKEN
    if (!creditToken) {
      console.error('NILAUTH_CREDIT_TOKEN is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Make request to the credential service
    const response = await fetch(`http://localhost:3030/v1/credential/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${creditToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Credential service error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch credentials' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching credentials:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const bearerToken = 'Nillion2025'

    // Make request to the usage service
    const response = await fetch('https://nilai-a779.nillion.network/v1/usage', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Usage service error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching usage data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
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

    const creditToken = process.env.NILAUTH_CREDIT_TOKEN
    if (!creditToken) {
      console.error('NILAUTH_CREDIT_TOKEN is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Make request to the credential service
    const response = await fetch(`http://localhost:3030/v1/credential/${credentialId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${creditToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Credential service error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to delete credential' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting credential:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


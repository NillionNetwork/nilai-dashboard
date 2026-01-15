import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'

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

    // Make request to the credential service
    const response = await fetch(`${CREDIT_SERVICE_URL}credential/${credentialId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
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


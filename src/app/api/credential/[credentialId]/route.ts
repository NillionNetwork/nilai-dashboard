import { NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'
import { withAuthAndCredentialOwnership } from '@/lib/api-wrapper'

export const DELETE = withAuthAndCredentialOwnership(async (request, claims, credentialId) => {
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
})


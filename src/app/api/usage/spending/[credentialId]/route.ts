import { NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'
import { withAuthAndCredentialOwnership } from '@/lib/api-wrapper'

export const GET = withAuthAndCredentialOwnership(async (request, claims, credentialId) => {
  const response = await fetch(`${CREDIT_SERVICE_URL}credential/${credentialId}/spending`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Spending service error:', response.status, errorText)
    return NextResponse.json(
      { error: 'Failed to fetch spending data' },
      { status: response.status }
    )
  }

  const data = await response.json()
  return NextResponse.json(data, { status: 200 })
})

import { NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'
import { withAuthAndCredentialOwnership } from '@/lib/api-wrapper'

export const GET = withAuthAndCredentialOwnership(async (request, claims, credentialId) => {
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
})

export const PUT = withAuthAndCredentialOwnership(async (request, claims, credentialId) => {
  const body = await request.json()

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
})

import { NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'
import { stripe } from '@/lib/stripe'
import { withAuthAndUserIdFromBody } from '@/lib/api-wrapper'

export const POST = withAuthAndUserIdFromBody(async (request, claims, body) => {
  const { user_id, credential_key, is_public } = body

  if (!credential_key) {
    return NextResponse.json(
      { error: 'credential_key is required' },
      { status: 400 }
    )
  }

  // Check if user is a trial user (no payment history)
  let isTrialUser: boolean
  try {
    const customers = await stripe.customers.search({
      query: `metadata['user_id']:'${user_id}'`,
      limit: 1,
    })
    
    if (customers.data.length === 0) {
      isTrialUser = true
    } else {
      const customer = customers.data[0]
      const invoices = await stripe.invoices.list({
        customer: customer.id,
        limit: 1,
      })
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 1,
      })
      isTrialUser = invoices.data.length === 0 && paymentIntents.data.length === 0
    }
  } catch (error) {
    console.error('Error checking payment history:', error)
    // If check fails, assume trial user
    isTrialUser = true
  }

  // Make request to the credential service
  const response = await fetch(`${CREDIT_SERVICE_URL}credential`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
    },
    body: JSON.stringify({
      user_id,
      credential_key,
      is_public: is_public ?? false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Credential service error:', response.status, errorText)
    return NextResponse.json(
      { error: 'Failed to create credential' },
      { status: response.status }
    )
  }

  const data = await response.json()
  
  // If trial user, set rate limits for the credential
  if (isTrialUser && data.credential_id) {
    try {
      await fetch(`${CREDIT_SERVICE_URL}credential/${data.credential_id}/rate-limits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
        },
        body: JSON.stringify({
          limit_per_day: null,
          limit_per_hour: null,
          limit_per_month: 1.0,
          limit_per_week: null,
        }),
      })
    } catch (error) {
      console.error('Error setting rate limits for trial credential:', error)
      // Don't fail the credential creation if rate limit setting fails
    }
  }

  return NextResponse.json(data, { status: 200 })
})


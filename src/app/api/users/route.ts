import { NextResponse } from 'next/server'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'
import { withAuthAndUserIdFromBody } from '@/lib/api-wrapper'

export const POST = withAuthAndUserIdFromBody(async (request, claims, body) => {
  const { user_id } = body

  // Create user with 0 balance first
  const createResponse = await fetch(`${CREDIT_SERVICE_URL}users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
    },
    body: JSON.stringify({
      user_id,
      balance: 0,
    }),
  })

  if (!createResponse.ok) {
    const errorText = await createResponse.text()
    console.error('Credit service error:', createResponse.status, errorText)
    return NextResponse.json(
      { error: 'Failed to create user in credit service' },
      { status: createResponse.status }
    )
  }

  const userData = await createResponse.json()

  // Always give $1 credits to new users via topup (this persists even after they become paying customers)
  const topupResponse = await fetch(`${CREDIT_SERVICE_URL}users/topup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
    },
    body: JSON.stringify({
      user_id,
      amount: 1.0,
    }),
  })

  if (!topupResponse.ok) {
    const errorText = await topupResponse.text()
    console.error('Credit service topup error:', topupResponse.status, errorText)
    // Don't fail user creation if topup fails, but log it
    console.warn(`Failed to add $1 welcome credits to user ${user_id}`)
  } else {
    console.log(`Successfully added $1 welcome credits to user ${user_id}`)
  }

  return NextResponse.json(userData, { status: 200 })
})

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Disable body parsing, need raw body for Stripe signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const user_id = session.metadata?.user_id
      const amount = session.metadata?.amount

      if (!user_id || !amount) {
        console.error('Missing user_id or amount in session metadata')
        return NextResponse.json(
          { error: 'Missing metadata' },
          { status: 400 }
        )
      }

      // Only process if payment was successful
      if (session.payment_status === 'paid') {
        const creditToken = process.env.NILAUTH_CREDIT_TOKEN
        if (!creditToken) {
          console.error('NILAUTH_CREDIT_TOKEN is not configured')
          return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
          )
        }

        // Make request to the credit service to add credits
        const response = await fetch('http://localhost:3030/v1/users/topup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${creditToken}`,
          },
          body: JSON.stringify({
            user_id,
            amount: parseFloat(amount),
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Credit service error:', response.status, errorText)
          return NextResponse.json(
            { error: 'Failed to top up credits' },
            { status: response.status }
          )
        }

        console.log(`Successfully added ${amount} credits to user ${user_id}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


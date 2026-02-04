import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { CREDIT_SERVICE_URL, CREDIT_SERVICE_TOKEN } from '@/lib/credit-service'
import { stripe } from '@/lib/stripe'

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
        // Link Stripe customer to our user_id (needed for wallet-only users: Stripe creates
        // the customer at checkout, so only the webhook can set metadata for payment history/portal)
        if (session.customer) {
          try {
            await stripe.customers.update(session.customer as string, {
              metadata: { user_id },
            })
          } catch (updateError) {
            console.warn('Failed to update customer metadata:', updateError)
          }
        }

        // Make request to the credit service to add credits
        const response = await fetch(`${CREDIT_SERVICE_URL}users/topup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CREDIT_SERVICE_TOKEN}`,
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


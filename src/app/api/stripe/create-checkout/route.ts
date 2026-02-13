import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { withAuthAndUserIdFromBody } from '@/lib/api-wrapper'

export const POST = withAuthAndUserIdFromBody(async (request, claims, body) => {
  const { user_id, amount, customer_email } = body

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: 'amount must be a positive number' },
      { status: 400 }
    )
  }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Find or create a Stripe Customer using user_id as primary identifier
    let customer: Stripe.Customer | null = null
    
    // First, try to find existing customer by user_id metadata using Search API
    try {
      const searchResults = await stripe.customers.search({
        query: `metadata['user_id']:'${user_id}'`,
        limit: 1,
      })

      if (searchResults.data.length > 0) {
        customer = searchResults.data[0]
        // Update email if provided and different
        if (customer_email && customer.email !== customer_email) {
          customer = await stripe.customers.update(customer.id, {
            email: customer_email,
          })
        }
      }
    } catch (searchError) {
      // Search API might not be available in all Stripe accounts, fall back to list
      console.warn('Customer search failed, falling back to list:', searchError)
    }

    // If not found via search, try by email
    if (!customer && customer_email) {
      const existingByEmail = await stripe.customers.list({
        email: customer_email,
        limit: 1,
      })

      if (existingByEmail.data.length > 0) {
        customer = existingByEmail.data[0]
        // Check if metadata matches, if not update it
        if (customer.metadata?.user_id !== user_id) {
          customer = await stripe.customers.update(customer.id, {
            metadata: { user_id },
          })
        }
      }
    }

    // Create customer if not found (only if we have email)
    // If no email, Stripe will create customer when user enters email on checkout page
    if (!customer && customer_email) {
      customer = await stripe.customers.create({
        email: customer_email,
        metadata: {
          user_id: user_id,
        },
      })
    }

    // Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'nilAI Credits Top-up',
              description: `Add $${amount.toFixed(2)} in credits to your account`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      automatic_tax: {
        enabled: true,
      },
      invoice_creation: {
        enabled: true,
      },
      billing_address_collection: 'required',
      tax_id_collection: {
        enabled: true,
      },
      success_url: `${request.headers.get('origin') || 'http://localhost:3000'}/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin') || 'http://localhost:3000'}/credits?canceled=true`,
      metadata: {
        user_id: String(user_id),
        amount: String(amount),
      },
    }

    // Associate with customer if we have one, otherwise let Stripe create one
    if (customer && customer.id) {
      sessionParams.customer = customer.id
      // customer_update is only valid when using an existing customer
      sessionParams.customer_update = {
        name: 'auto',
        address: 'auto',
      }
    } else if (customer_email) {
      // Pre-fill email if we have it, but let Stripe create customer
      sessionParams.customer_email = customer_email
    }
    // If no customer and no email, Stripe will prompt for email on checkout page

  const session = await stripe.checkout.sessions.create(sessionParams)

  return NextResponse.json({ sessionId: session.id, url: session.url })
})


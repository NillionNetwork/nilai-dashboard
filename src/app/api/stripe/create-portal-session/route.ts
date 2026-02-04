import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
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

    // Find Stripe Customer using user_id via Search API
    let customer: Stripe.Customer | null = null
    
    try {
      const searchResults = await stripe.customers.search({
        query: `metadata['user_id']:'${user_id}'`,
        limit: 1,
      })

      if (searchResults.data.length > 0) {
        customer = searchResults.data[0]
      }
    } catch (searchError) {
      // Search API might not be available, fall back to empty result
      console.warn('Customer search failed:', searchError)
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'No customer found. Please make a payment first.' },
        { status: 404 }
      )
    }

    // Create Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${request.headers.get('origin') || 'http://localhost:3000'}/credits`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

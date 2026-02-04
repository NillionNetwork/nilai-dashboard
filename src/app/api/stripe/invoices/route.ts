import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const user_id = searchParams.get('user_id')

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
      // No customer found - return empty array
      return NextResponse.json({
        transactions: [],
      })
    }

    // Fetch checkout sessions (one-time payments don't create invoices automatically)
    const checkoutSessions = await stripe.checkout.sessions.list({
      customer: customer.id,
      limit: 100,
    })

    // Fetch invoices (for subscriptions or manually created invoices)
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 100,
    })

    // Format invoices (prioritize these since they have invoice PDFs/URLs)
    const formattedInvoices = invoices.data
      .filter((invoice) => invoice.status === 'paid' || invoice.status === 'open')
      .map((invoice) => ({
        id: invoice.id,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        status: invoice.status,
        created: invoice.created,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        description: invoice.description || invoice.lines?.data[0]?.description || 'Credits Top-up',
      }))

    // Format checkout sessions (only include those without invoices)
    const formattedCheckouts = checkoutSessions.data
      .filter((session) => session.payment_status === 'paid' && !session.invoice)
      .map((session) => {
        const amountTotal = session.amount_total || 0
        const amount = session.metadata?.amount ? parseFloat(session.metadata.amount) : amountTotal / 100
        return {
          id: session.id,
          amount: amount,
          currency: (session.currency || 'usd').toUpperCase(),
          status: 'paid',
          created: session.created,
          invoice_pdf: null,
          hosted_invoice_url: null,
          description: `Credits Top-up - $${amount.toFixed(2)}`,
        }
      })

    // Combine: invoices first (they have invoice URLs), then checkout sessions without invoices
    const allTransactions = [
      ...formattedInvoices.map((inv) => ({ ...inv, type: 'invoice' as const })),
      ...formattedCheckouts.map((checkout) => ({ ...checkout, type: 'checkout' as const })),
    ].sort((a, b) => b.created - a.created)

    return NextResponse.json({
      transactions: allTransactions,
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

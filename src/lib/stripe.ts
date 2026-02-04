import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not configured')
  throw new Error('STRIPE_SECRET_KEY is required')
}

/**
 * Centralized Stripe client instance
 * Uses account default API version (set in Stripe Dashboard)
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

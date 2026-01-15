/**
 * Credit service configuration
 * Validates required environment variables on module load
 */

const creditUrl = process.env.NILAUTH_CREDIT_URL
const creditToken = process.env.NILAUTH_CREDIT_TOKEN

if (!creditUrl) {
  console.error('❌ NILAUTH_CREDIT_URL environment variable is not set')
  console.error('Please add NILAUTH_CREDIT_URL to your .env file')
  process.exit(1)
}

if (!creditToken) {
  console.error('❌ NILAUTH_CREDIT_TOKEN environment variable is not set')
  console.error('Please add NILAUTH_CREDIT_TOKEN to your .env file')
  process.exit(1)
}

export const CREDIT_SERVICE_URL = creditUrl
export const CREDIT_SERVICE_TOKEN = creditToken

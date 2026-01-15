'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { usePrivy } from '@privy-io/react-auth'
import { useUserCredits } from '@/hooks/useUserCredits'

const TOPUP_AMOUNTS = [10, 25, 50, 100, 250, 500]

function CreditsContent() {
  const { authenticated, user } = usePrivy()
  const { balance, loading } = useUserCredits()
  const searchParams = useSearchParams()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isToppingUp, setIsToppingUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Handle Stripe redirects
  useEffect(() => {
    const successParam = searchParams.get('success')
    const canceledParam = searchParams.get('canceled')
    const sessionId = searchParams.get('session_id')

    if (successParam === 'true' && sessionId) {
      setSuccess(true)
      setError(null)
      setSelectedAmount(null)
      setCustomAmount('')
      
      // Refresh credits after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)

      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url.toString())
    } else if (canceledParam === 'true') {
      setError('Payment was canceled. Please try again if you want to add credits.')
      
      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('canceled')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const handleTopup = async () => {
    if (!authenticated || !user) {
      setError('You must be logged in to top up credits')
      return
    }

    const amount = selectedAmount || parseFloat(customAmount)
    if (!amount || amount <= 0) {
      setError('Please select or enter a valid amount')
      return
    }

    setIsToppingUp(true)
    setError(null)
    setSuccess(false)

    try {
      // Create Stripe Checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          amount: amount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsToppingUp(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--nillion-bg)' }}>
        <Sidebar />
        <div className="ml-64">
          <Header />
          <main className="p-8">
            <div className="max-w-4xl">
              <h1 className="mb-2 text-white">Get Credits</h1>
              <p className="text-white opacity-80">Please log in to view your credits.</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--nillion-bg)' }}>
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-8">
          <div className="max-w-4xl">
            <h1 className="mb-2 text-white">Get Credits</h1>
            
            <div 
              className="rounded-lg p-6 mt-8"
              style={{
                backgroundColor: 'var(--nillion-bg-secondary)',
                border: '1px solid var(--nillion-border)',
              }}
            >
              <h2 className="mb-4 text-white font-semibold">Balance</h2>
              <div className="mb-6">
                <p className="text-sm text-white opacity-80 mb-1">Current balance:</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : `$${balance?.toFixed(2) ?? '0.00'}`}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="mb-4 text-white font-medium">Select top-up amount</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {TOPUP_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount)
                        setCustomAmount('')
                        setError(null)
                      }}
                      className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                      style={{
                        backgroundColor: selectedAmount === amount 
                          ? 'var(--nillion-primary-lightest)' 
                          : 'var(--nillion-bg)',
                        color: selectedAmount === amount 
                          ? 'var(--nillion-primary)' 
                          : '#ffffff',
                        border: '1px solid var(--nillion-border)',
                      }}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-white opacity-80 mb-2">
                    Or enter custom amount:
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value)
                      setSelectedAmount(null)
                      setError(null)
                    }}
                    placeholder="Enter amount"
                    className="w-full px-4 py-2 rounded-md text-sm"
                    style={{
                      backgroundColor: 'var(--nillion-bg)',
                      color: '#ffffff',
                      border: '1px solid var(--nillion-border)',
                    }}
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-md text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 rounded-md text-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                  Credits topped up successfully!
                </div>
              )}

              <button
                type="button"
                onClick={handleTopup}
                disabled={isToppingUp || (!selectedAmount && !customAmount)}
                className="px-6 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--nillion-primary)',
                  color: '#ffffff',
                  border: 'none',
                }}
              >
                {isToppingUp ? 'Redirecting to payment...' : 'Proceed to payment'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function CreditsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: 'var(--nillion-bg)' }}>
        <Sidebar />
        <div className="ml-64">
          <Header />
          <main className="p-8">
            <div className="max-w-4xl">
              <h1 className="mb-2 text-white">Get Credits</h1>
              <p className="text-white opacity-80">Loading...</p>
            </div>
          </main>
        </div>
      </div>
    }>
      <CreditsContent />
    </Suspense>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { usePrivy } from '@privy-io/react-auth'

interface UsageData {
  completion_tokens: number
  prompt_tokens: number
  total_tokens: number
  queries: number
}

export default function UsagePage() {
  const { authenticated, ready } = usePrivy()
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsage = async () => {
      if (!ready || !authenticated) {
        return
      }

      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/usage')
        if (response.ok) {
          const data = await response.json()
          setUsageData({
            completion_tokens: data.completion_tokens,
            prompt_tokens: data.prompt_tokens,
            total_tokens: data.total_tokens,
            queries: data.queries,
          })
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to fetch usage data')
        }
      } catch (err) {
        console.error('Error fetching usage:', err)
        setError('An error occurred while fetching usage data')
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [ready, authenticated])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--nillion-bg)' }}>
        <Sidebar />
        <div className="ml-64">
          <Header />
          <main className="p-8">
            <div className="max-w-6xl">
              <h1 className="mb-2 text-white">Usage</h1>
              <p className="text-white opacity-80">Please log in to view your usage statistics.</p>
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
          <div className="max-w-6xl">
            <h1 className="mb-2 text-white">Usage</h1>
            <p className="mb-8 text-white opacity-80">
              View your API usage statistics and token consumption.
            </p>

            {loading ? (
              <div className="text-white opacity-80">Loading usage data...</div>
            ) : error ? (
              <div className="p-4 rounded-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {error}
              </div>
            ) : usageData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div
                  className="rounded-lg p-6 transition-all hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--nillion-bg-secondary)',
                    border: '1px solid var(--nillion-border)',
                  }}
                >
                  <h3 className="mb-2 text-white font-medium" style={{ fontSize: '16px' }}>Total Tokens</h3>
                  <p className="mb-4 text-xs text-white opacity-70">Sum of all tokens used</p>
                  <p className="text-3xl font-bold text-white">{formatNumber(usageData.total_tokens)}</p>
                </div>

                <div
                  className="rounded-lg p-6 transition-all hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--nillion-bg-secondary)',
                    border: '1px solid var(--nillion-border)',
                  }}
                >
                  <h3 className="mb-2 text-white font-medium" style={{ fontSize: '16px' }}>Prompt Tokens</h3>
                  <p className="mb-4 text-xs text-white opacity-70">Tokens in the input messages you send</p>
                  <p className="text-3xl font-bold text-white">{formatNumber(usageData.prompt_tokens)}</p>
                </div>

                <div
                  className="rounded-lg p-6 transition-all hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--nillion-bg-secondary)',
                    border: '1px solid var(--nillion-border)',
                  }}
                >
                  <h3 className="mb-2 text-white font-medium" style={{ fontSize: '16px' }}>Completion Tokens</h3>
                  <p className="mb-4 text-xs text-white opacity-70">Tokens in the model's response output</p>
                  <p className="text-3xl font-bold text-white">{formatNumber(usageData.completion_tokens)}</p>
                </div>

                <div
                  className="rounded-lg p-6 transition-all hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--nillion-bg-secondary)',
                    border: '1px solid var(--nillion-border)',
                  }}
                >
                  <h3 className="mb-2 text-white font-medium" style={{ fontSize: '16px' }}>Queries</h3>
                  <p className="mb-4 text-xs text-white opacity-70">Total number of API requests made</p>
                  <p className="text-3xl font-bold text-white">{formatNumber(usageData.queries)}</p>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}


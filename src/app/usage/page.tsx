'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'

interface Credential {
  credential_id: string
  credential_key: string
  user_id: string
  is_public: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface RateLimits {
  credential_id: string
  limit_per_hour: number | null
  limit_per_day: number | null
  limit_per_week: number | null
  limit_per_month: number | null
  current_spending: {
    hour: number
    day: number
    week: number
    month: number
  }
}

interface SpendingEvent {
  event_id: string
  amount: number
  timestamp: string
  lock_id: string
}

interface CredentialUsage {
  credential: Credential
  rateLimits: RateLimits | null
  spendingEvents: SpendingEvent[]
  loading: boolean
  error: string | null
}

export default function UsagePage() {
  const { authenticated, ready, user } = usePrivy()
  const [_, setCredentials] = useState<Credential[]>([])
  const [usageData, setUsageData] = useState<CredentialUsage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCredentials, setExpandedCredentials] = useState<Set<string>>(new Set())
  const [expandedSpending, setExpandedSpending] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchCredentials = async () => {
      if (!ready || !authenticated || !user) {
        return
      }

      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/credential/user/${user.id}`)
        if (response.ok) {
          const data = await response.json()
          const creds = data.credentials || []
          setCredentials(creds)
          
          // Fetch usage data for each credential
          const usagePromises = creds.map(async (cred: Credential) => {
            const [rateLimitsRes, spendingRes] = await Promise.all([
              fetch(`/api/usage/rate-limits/${cred.credential_id}`),
              fetch(`/api/usage/spending/${cred.credential_id}`)
            ])

            const rateLimits = rateLimitsRes.ok ? await rateLimitsRes.json() : null
            const spendingData = spendingRes.ok ? await spendingRes.json() : { events: [] }
            
            // Limit to latest 100 events
            const events = (spendingData.events || []).slice(0, 100)

            return {
              credential: cred,
              rateLimits,
              spendingEvents: events,
              loading: false,
              error: null
            }
          })

          const usageResults = await Promise.all(usagePromises)
          setUsageData(usageResults)
        } else {
          setError('Failed to fetch credentials')
        }
      } catch (err) {
        console.error('Error fetching usage data:', err)
        setError('An error occurred while fetching usage data')
      } finally {
        setLoading(false)
      }
    }

    fetchCredentials()
  }, [ready, authenticated, user])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(6)}`
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return key
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4)
  }

  const toggleCredential = (credentialId: string) => {
    setExpandedCredentials(prev => {
      const newSet = new Set(prev)
      if (newSet.has(credentialId)) {
        newSet.delete(credentialId)
      } else {
        newSet.add(credentialId)
      }
      return newSet
    })
  }

  const toggleSpending = (credentialId: string) => {
    setExpandedSpending(prev => {
      const newSet = new Set(prev)
      if (newSet.has(credentialId)) {
        newSet.delete(credentialId)
      } else {
        newSet.add(credentialId)
      }
      return newSet
    })
  }

  if (!authenticated) {
    return (
      <div className="max-w-6xl">
        <h1 className="mb-2 text-white">Usage</h1>
        <p className="text-white opacity-80 mb-6">Please log in to view your usage statistics.</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="max-w-6xl">
        <p className="text-white opacity-80">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
            <h1 className="mb-2 text-white">Usage</h1>
            <p className="mb-8 text-white opacity-80">
              View spending and usage statistics for your credentials.
            </p>

            {loading ? (
              <div className="text-white opacity-80">Loading usage data...</div>
            ) : error ? (
              <div className="p-4 rounded-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {error}
              </div>
            ) : usageData.length === 0 ? (
              <div className="p-4 rounded-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <p>No credentials found. Create an API key to view usage statistics.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {usageData.map((usage) => {
                  const isExpanded = expandedCredentials.has(usage.credential.credential_id)
                  const isSpendingExpanded = expandedSpending.has(usage.credential.credential_id)
                  const displayedEvents = isSpendingExpanded 
                    ? usage.spendingEvents 
                    : usage.spendingEvents.slice(0, 5)
                  const hasMoreEvents = usage.spendingEvents.length > 5

                  return (
                    <div
                      key={usage.credential.credential_id}
                      className="rounded-lg"
                      style={{
                        backgroundColor: 'var(--nillion-bg-secondary)',
                        border: '1px solid var(--nillion-border)',
                      }}
                    >
                      {/* Credential Header - Clickable */}
                      <div
                        className="p-4 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleCredential(usage.credential.credential_id)}
                      >
                        <div className="flex items-center gap-3">
                          <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            style={{ color: '#ffffff', opacity: 0.7 }}
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-semibold text-white">
                                {usage.credential.credential_key.startsWith('did:nil:') ? 'DID' : 'API Key'}
                              </h2>
                              {usage.rateLimits && usage.rateLimits.limit_per_month !== null && (
                                <span 
                                  className="px-2 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    color: '#3b82f6',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                  }}
                                >
                                  Free Trial
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-white opacity-70 font-mono">
                              {usage.credential.credential_key.startsWith('did:nil:')
                                ? usage.credential.credential_key
                                : maskKey(usage.credential.credential_key)}
                            </p>
                          </div>
                        </div>
                        {usage.rateLimits && (
                          <div className="text-right">
                            <p className="text-xs text-white opacity-70">Last 30 Days</p>
                            <p className="text-lg font-semibold text-white">
                              {formatAmount(usage.rateLimits.current_spending.month)}
                              {usage.rateLimits.limit_per_month !== null && (
                                <span className="text-sm font-normal opacity-70 ml-1">
                                  / {formatAmount(usage.rateLimits.limit_per_month)}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Expandable Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--nillion-border)' }}>
                          {usage.rateLimits && (
                            <div className="mt-4 mb-6">
                              <h3 className="text-sm font-semibold text-white mb-4">Current Spending</h3>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-white opacity-70 mb-1">Hour</p>
                                  <p className="text-lg font-semibold text-white">
                                    {formatAmount(usage.rateLimits.current_spending.hour)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-white opacity-70 mb-1">Day</p>
                                  <p className="text-lg font-semibold text-white">
                                    {formatAmount(usage.rateLimits.current_spending.day)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-white opacity-70 mb-1">Week</p>
                                  <p className="text-lg font-semibold text-white">
                                    {formatAmount(usage.rateLimits.current_spending.week)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-white opacity-70 mb-1">
                                    Month
                                    {usage.rateLimits.limit_per_month !== null && (
                                      <span className="ml-1">(Limit: {formatAmount(usage.rateLimits.limit_per_month)})</span>
                                    )}
                                  </p>
                                  <p className="text-lg font-semibold text-white">
                                    {formatAmount(usage.rateLimits.current_spending.month)}
                                    {usage.rateLimits.limit_per_month !== null && (
                                      <span className="text-sm font-normal opacity-70 ml-1">
                                        / {formatAmount(usage.rateLimits.limit_per_month)}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <h3 className="text-sm font-semibold text-white mb-4">
                              Spending Events {usage.spendingEvents.length > 0 && `(${usage.spendingEvents.length} total)`}
                            </h3>
                            {usage.spendingEvents.length === 0 ? (
                              <p className="text-sm text-white opacity-70">No spending events found.</p>
                            ) : (
                              <>
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="border-b" style={{ borderColor: 'var(--nillion-border)' }}>
                                        <th className="text-left py-2 px-4 text-sm font-semibold text-white">Timestamp</th>
                                        <th className="text-right py-2 px-4 text-sm font-semibold text-white">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {displayedEvents.map((event) => (
                                        <tr
                                          key={event.event_id}
                                          className="border-b"
                                          style={{ borderColor: 'var(--nillion-border)' }}
                                        >
                                          <td className="py-2 px-4 text-sm text-white opacity-80">
                                            {formatDate(event.timestamp)}
                                          </td>
                                          <td className="py-2 px-4 text-sm text-white text-right font-mono">
                                            {formatAmount(event.amount)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {hasMoreEvents && (
                                  <div className="mt-4 text-center">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleSpending(usage.credential.credential_id)
                                      }}
                                      className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                                      style={{
                                        backgroundColor: 'var(--nillion-primary-lightest)',
                                        color: 'var(--nillion-primary)',
                                        border: 'none',
                                      }}
                                    >
                                      {isSpendingExpanded 
                                        ? `Show less (${displayedEvents.length} events)` 
                                        : `Show all ${usage.spendingEvents.length} events`}
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
  )
}

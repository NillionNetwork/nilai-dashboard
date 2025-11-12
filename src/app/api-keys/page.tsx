'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
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

export default function ApiKeysPage() {
  const { authenticated, user, ready } = usePrivy()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchCredentials = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/credential/user/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setCredentials(data.credentials || [])
      } else {
        console.error('Failed to fetch credentials')
      }
    } catch (error) {
      console.error('Error fetching credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ready && authenticated && user) {
      fetchCredentials()
    }
  }, [ready, authenticated, user])

  const handleCreate = async () => {
    if (!user || !keyName.trim()) {
      setError('Please enter a key name')
      return
    }

    setIsCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/credential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          credential_key: keyName.trim(),
          is_public: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create credential')
      }

      setSuccess('Credential created successfully')
      setKeyName('')
      setShowCreateModal(false)
      fetchCredentials()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (credentialId: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return
    }

    try {
      const response = await fetch(`/api/credential/${credentialId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete credential')
      }

      setSuccess('Credential deleted successfully')
      fetchCredentials()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess('API key copied to clipboard')
      setTimeout(() => setSuccess(null), 2000)
    } catch (error) {
      setError('Failed to copy to clipboard')
      setTimeout(() => setError(null), 2000)
    }
  }

  const maskKey = (key: string) => {
    // Return all stars to mask the key
    return '****************'
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--nillion-bg)' }}>
        <Sidebar />
        <div className="ml-64">
          <Header />
          <main className="p-8">
            <div className="max-w-6xl">
              <h1 className="mb-2 text-white">API keys</h1>
              <p className="text-white opacity-80">Please log in to view your API keys.</p>
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-white">API keys</h1>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--nillion-primary)',
                  color: '#ffffff',
                  border: 'none',
                }}
              >
                <span>+</span>
                <span>Create new API key</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-md text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-md text-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                {success}
              </div>
            )}

            {loading ? (
              <div className="text-white opacity-80">Loading...</div>
            ) : (
              <div 
                className="rounded-lg overflow-hidden"
                style={{
                  backgroundColor: 'var(--nillion-bg-secondary)',
                  border: '1px solid var(--nillion-border)',
                }}
              >
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--nillion-border)' }}>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-white">Name</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-white">API key</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-white">Created</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-white">Last used</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-white"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {credentials.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-white opacity-80">
                          No API keys found. Create your first key to get started.
                        </td>
                      </tr>
                    ) : (
                      credentials.map((credential) => (
                        <tr 
                          key={credential.credential_id}
                          style={{ borderBottom: '1px solid var(--nillion-border)' }}
                        >
                          <td className="px-6 py-4 text-white">{credential.credential_key}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-mono text-sm">{maskKey(credential.credential_id)}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(credential.credential_id)}
                                className="px-2 py-1 rounded text-xs font-medium transition-opacity hover:opacity-90"
                                style={{
                                  backgroundColor: 'var(--nillion-primary-lightest)',
                                  color: 'var(--nillion-primary)',
                                  border: 'none',
                                }}
                                title="Copy to clipboard"
                              >
                                Copy
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white opacity-80">{formatDate(credential.created_at)}</td>
                          <td className="px-6 py-4 text-white opacity-80">{formatDate(credential.updated_at)}</td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => handleDelete(credential.credential_id)}
                              className="px-3 py-1 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="rounded-lg p-6 max-w-md w-full mx-4"
            style={{
              backgroundColor: 'var(--nillion-bg-secondary)',
              border: '1px solid var(--nillion-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-white mb-4">Create new secret key</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-white opacity-80 mb-2">
                Key name
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => {
                  setKeyName(e.target.value)
                  setError(null)
                }}
                placeholder="Enter key name"
                className="w-full px-4 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: 'var(--nillion-bg)',
                  color: '#ffffff',
                  border: '1px solid var(--nillion-border)',
                }}
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-md text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  setKeyName('')
                  setError(null)
                }}
                className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'var(--nillion-bg)',
                  color: '#ffffff',
                  border: '1px solid var(--nillion-border)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating || !keyName.trim()}
                className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--nillion-primary)',
                  color: '#ffffff',
                  border: 'none',
                }}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


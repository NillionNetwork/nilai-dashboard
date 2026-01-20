'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
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
  const { authenticated, user, ready, login } = usePrivy()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateDidModal, setShowCreateDidModal] = useState(false)
  const [didValue, setDidValue] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Separate credentials into API keys and DIDs
  const apiKeys = credentials.filter(c => !c.credential_key.startsWith('did:key:'))
  const dids = credentials.filter(c => c.credential_key.startsWith('did:key:'))

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
    if (!user) {
      setError('User not authenticated')
      return
    }

    setIsCreating(true)
    setError(null)
    setSuccess(null)

    // Generate UUIDv4 for credential_key
    const credentialKey = uuidv4()

    try {
      const response = await fetch('/api/credential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          credential_key: credentialKey,
          is_public: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create credential')
      }

      setSuccess('API key created successfully')
      setShowCreateModal(false)
      fetchCredentials()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateDid = async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    const trimmedDid = didValue.trim()
    if (!trimmedDid) {
      setError('Please enter a DID')
      return
    }

    if (!trimmedDid.startsWith('did:key:')) {
      setError('DID must start with did:key:')
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
          credential_key: trimmedDid,
          is_public: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create DID')
      }

      setSuccess('DID added successfully')
      setShowCreateDidModal(false)
      setDidValue('')
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

  const copyToClipboard = async (text: string, label: string = 'API key') => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess(`${label} copied to clipboard`)
      setTimeout(() => setSuccess(null), 2000)
    } catch (error) {
      setError('Failed to copy to clipboard')
      setTimeout(() => setError(null), 2000)
    }
  }

  const renderCredentialsTable = (items: Credential[], emptyMessage: string, firstColumnHeader: string = 'API key') => (
    <div 
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--nillion-bg-secondary)',
        border: '1px solid var(--nillion-border)',
      }}
    >
      <table className="w-full table-fixed">
        <colgroup>
          <col style={{ width: '60%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '20%' }} />
        </colgroup>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--nillion-border)' }}>
            <th className="text-left px-6 py-3 text-sm font-semibold text-white">{firstColumnHeader}</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-white">Created</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-white"></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-8 text-center text-white opacity-80">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            items.map((credential) => (
              <tr 
                key={credential.credential_id}
                style={{ borderBottom: '1px solid var(--nillion-border)' }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm break-all">{credential.credential_key}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(credential.credential_key, credential.credential_key.startsWith('did:key:') ? 'DID' : 'API key')}
                      className="px-2 py-1 rounded text-xs font-medium transition-opacity hover:opacity-90 flex-shrink-0"
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
                <td className="px-6 py-4 text-white opacity-80 whitespace-nowrap">{formatDate(credential.created_at)}</td>
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
  )

  if (!authenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--nillion-bg)' }}>
        <Sidebar />
        <div className="ml-64">
          <Header />
          <main className="p-8">
            <div className="max-w-6xl">
              <h1 className="mb-2 text-white">API keys</h1>
              <p className="text-white opacity-80 mb-6">Please log in to manage your API keys.</p>
              <button
                type="button"
                onClick={() => login()}
                disabled={!ready}
                className="px-6 py-3 rounded-md text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--nillion-primary)',
                  color: '#ffffff',
                  border: 'none',
                }}
              >
                {!ready ? 'Loading...' : 'Login with Privy'}
              </button>
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
            <div className="mb-6">
              <h1 className="text-white mb-2">API keys</h1>
              <p className="text-white opacity-80">Manage your API keys and DIDs for authentication and delegation</p>
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
              <>
                {/* API Keys Section */}
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">API Keys</h2>
                      <p className="text-sm text-white opacity-70">
                        For use with the{' '}
                        <a 
                          href="https://docs.nillion.com/build/private-llms/usage#api-key-flow" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:opacity-80"
                          style={{ color: 'var(--nillion-primary)' }}
                        >
                          API key flow
                        </a>
                      </p>
                    </div>
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
                  {renderCredentialsTable(apiKeys, 'No API keys found. Create your first key to get started.')}
                </div>

                {/* DIDs Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">DIDs</h2>
                      <p className="text-sm text-white opacity-70">
                        Decentralized Identifiers for use with NUCs and the{' '}
                        <a 
                          href="https://docs.nillion.com/build/private-llms/usage#delegation-flow" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:opacity-80"
                          style={{ color: 'var(--nillion-primary)' }}
                        >
                          Delegation flow
                        </a>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreateDidModal(true)}
                      className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 flex items-center gap-2"
                      style={{
                        backgroundColor: 'var(--nillion-primary)',
                        color: '#ffffff',
                        border: 'none',
                      }}
                    >
                      <span>+</span>
                      <span>Add DID</span>
                    </button>
                  </div>
                  {renderCredentialsTable(dids, 'No DIDs found. Add your first DID to get started.', 'DID')}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Create API Key Modal */}
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
            <h2 className="text-xl font-semibold text-white mb-4">Create new API key</h2>
            
            <p className="text-sm text-white opacity-80 mb-4">
              A new API key will be generated automatically. You'll be able to copy it after creation.
            </p>

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
                disabled={isCreating}
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

      {/* Create DID Modal */}
      {showCreateDidModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => {
            setShowCreateDidModal(false)
            setDidValue('')
            setError(null)
          }}
        >
          <div 
            className="rounded-lg p-6 max-w-md w-full mx-4"
            style={{
              backgroundColor: 'var(--nillion-bg-secondary)',
              border: '1px solid var(--nillion-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-white mb-4">Add DID</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-white opacity-80 mb-2">
                DID (must start with <code className="text-xs">did:key:</code>)
              </label>
              <input
                type="text"
                value={didValue}
                onChange={(e) => {
                  setDidValue(e.target.value)
                  setError(null)
                }}
                placeholder="did:key:..."
                className="w-full px-4 py-2 rounded-md text-sm font-mono"
                style={{
                  backgroundColor: 'var(--nillion-bg)',
                  color: '#ffffff',
                  border: '1px solid var(--nillion-border)',
                }}
                autoFocus
              />
              <p className="text-xs text-white opacity-60 mt-2">
                Used for NUCs and the{' '}
                <a 
                  href="https://docs.nillion.com/build/private-llms/usage#delegation-flow" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80"
                  style={{ color: 'var(--nillion-primary)' }}
                >
                  Delegation flow
                </a>
              </p>
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
                  setShowCreateDidModal(false)
                  setDidValue('')
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
                onClick={handleCreateDid}
                disabled={isCreating || !didValue.trim()}
                className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--nillion-primary)',
                  color: '#ffffff',
                  border: 'none',
                }}
              >
                {isCreating ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


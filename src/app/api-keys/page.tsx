'use client'

import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { usePrivy } from '@privy-io/react-auth'
import { useUserCredits } from '@/hooks/useUserCredits'
import EC from 'elliptic'

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
  const router = useRouter()
  const { authenticated, user, ready } = usePrivy()
  const { balance } = useUserCredits()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateDidModal, setShowCreateDidModal] = useState(false)
  const [didValue, setDidValue] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasPaymentHistory, setHasPaymentHistory] = useState<boolean | null>(null)
  const [unmaskedKeys, setUnmaskedKeys] = useState<Set<string>>(new Set())
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false)
  const [didSectionExpanded, setDidSectionExpanded] = useState(false)
  const [didCreationMode, setDidCreationMode] = useState<'enter' | 'generate'>('generate')
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState<string | null>(null)
  const [generatedPublicKey, setGeneratedPublicKey] = useState<string | null>(null)

  // Separate credentials into API keys and DIDs
  const apiKeys = credentials.filter(c => !c.credential_key.startsWith('did:nil:'))
  const dids = credentials.filter(c => c.credential_key.startsWith('did:nil:'))

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

  // Check if user has payment history
  const checkPaymentHistory = useCallback(async () => {
    if (!authenticated || !user) {
      setHasPaymentHistory(null)
      return
    }

    try {
      const response = await fetch(`/api/stripe/invoices?user_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setHasPaymentHistory((data.transactions || []).length > 0)
      } else {
        setHasPaymentHistory(false)
      }
    } catch (error) {
      console.error('Error checking payment history:', error)
      setHasPaymentHistory(false)
    }
  }, [authenticated, user])

  useEffect(() => {
    if (ready && authenticated && user) {
      fetchCredentials()
      checkPaymentHistory()
    }
  }, [ready, authenticated, user, checkPaymentHistory])

  // Check if user is new (no credits and no payment history)
  const isNewUser = balance !== null && balance <= 0 && hasPaymentHistory === false

  const handleCreateClick = () => {
    if (isNewUser) {
      setError('Please add credits first before creating API keys. Visit the Credits page to get started.')
      return
    }
    setShowCreateModal(true)
  }

  const handleCreateDidClick = () => {
    if (isNewUser) {
      setError('Please add credits first before adding DIDs. Visit the Credits page to get started.')
      return
    }
    setDidCreationMode('generate')
    setGeneratedPrivateKey(null)
    setGeneratedPublicKey(null)
    setDidValue('')
    setShowCreateDidModal(true)
  }

  const generateKeypair = () => {
    try {
      // Initialize secp256k1 curve
      const ec = new EC.ec('secp256k1')
      
      // Generate a new key pair
      const keyPair = ec.genKeyPair()
      
      // Get private key as hex (32 bytes = 64 hex chars)
      const privateKeyHex = keyPair.getPrivate('hex').padStart(64, '0')
      
      // Get compressed public key as hex
      const publicKeyHex = keyPair.getPublic(true, 'hex') // true = compressed
      
      // Format as did:nil:{publicKeyHex}
      const did = `did:nil:${publicKeyHex}`
      
      setGeneratedPrivateKey(privateKeyHex)
      setGeneratedPublicKey(did)
      setDidValue(did)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate keypair')
    }
  }

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

    if (!trimmedDid.startsWith('did:nil:')) {
      setError('DID must start with did:nil:')
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
      setGeneratedPrivateKey(null)
      setGeneratedPublicKey(null)
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

  const copyToClipboard = async (text: string, credentialId: string | null = null) => {
    try {
      await navigator.clipboard.writeText(text)
      // Set copied state for visual feedback (only for API keys with credentialId)
      if (credentialId) {
        setCopiedKeyId(credentialId)
        setTimeout(() => {
          setCopiedKeyId(null)
        }, 1000)
      }
    } catch (error) {
      setError('Failed to copy to clipboard')
      setTimeout(() => setError(null), 2000)
    }
  }

  const copyPrivateKey = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Set copied state for visual feedback
      setCopiedPrivateKey(true)
      setTimeout(() => {
        setCopiedPrivateKey(false)
      }, 1000)
    } catch (error) {
      setError('Failed to copy to clipboard')
      setTimeout(() => setError(null), 2000)
    }
  }

  const useOnQuickstart = (apiKey: string) => {
    router.push(`/?apiKey=${encodeURIComponent(apiKey)}`)
  }

  const toggleMask = (credentialId: string) => {
    setUnmaskedKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(credentialId)) {
        newSet.delete(credentialId)
      } else {
        newSet.add(credentialId)
      }
      return newSet
    })
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••'
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4)
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
                    <span className="text-white font-mono text-sm break-all">
                      {credential.credential_key.startsWith('did:nil:')
                        ? credential.credential_key
                        : unmaskedKeys.has(credential.credential_id) 
                          ? credential.credential_key 
                          : maskKey(credential.credential_key)}
                    </span>
                    {!credential.credential_key.startsWith('did:nil:') && (
                      <button
                        type="button"
                        onClick={() => toggleMask(credential.credential_id)}
                        className="p-1.5 rounded transition-opacity hover:opacity-90 shrink-0"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#ffffff',
                          border: 'none',
                        }}
                        title={unmaskedKeys.has(credential.credential_id) ? 'Mask' : 'Unmask'}
                      >
                        {unmaskedKeys.has(credential.credential_id) ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    )}
                    {!credential.credential_key.startsWith('did:nil:') && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(credential.credential_key, credential.credential_id, 'API key')}
                        className="p-1.5 rounded transition-all duration-300 hover:opacity-90 shrink-0"
                        style={{
                          backgroundColor: copiedKeyId === credential.credential_id 
                            ? 'var(--nillion-primary-lightest)' 
                            : 'transparent',
                          color: copiedKeyId === credential.credential_id 
                            ? 'var(--nillion-primary)' 
                            : '#ffffff',
                          border: 'none',
                        }}
                        title="Copy to clipboard"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    )}
                    {!credential.credential_key.startsWith('did:nil:') && (
                      <button
                        type="button"
                        onClick={() => useOnQuickstart(credential.credential_key)}
                        className="px-2 py-1.5 rounded transition-opacity hover:opacity-90 flex items-center gap-1.5 shrink-0"
                        style={{
                          backgroundColor: 'var(--nillion-primary-lightest)',
                          color: '#1e3a8a',
                          border: 'none',
                        }}
                        title="Use on quickstart"
                      >
                        <span className="text-xs font-medium">Quickstart</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
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
            </div>
          </main>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--nillion-bg)' }}>
      <Sidebar />
      <div className="ml-64 flex flex-col flex-1">
        <Header />
        <main className="p-8 flex-1">
          <div className="max-w-6xl">
            <div className="mb-6">
              <h1 className="text-white mb-2">API keys</h1>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-md text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {error}
                {error.includes('add credits first') && (
                  <div className="mt-3">
                    <Link
                      href="/credits"
                      className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 inline-block"
                      style={{
                        backgroundColor: 'var(--nillion-primary)',
                        color: '#ffffff',
                        border: 'none',
                      }}
                    >
                      Go to Credits Page →
                    </Link>
                  </div>
                )}
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
                  <div className="flex items-center justify-end mb-4">
                    <button
                      type="button"
                      onClick={handleCreateClick}
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
                  <div 
                    className="flex items-center justify-between mb-4 cursor-pointer"
                    onClick={() => setDidSectionExpanded(!didSectionExpanded)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className={`transition-transform ${didSectionExpanded ? 'rotate-90' : ''}`}
                        style={{ color: '#ffffff', opacity: 0.7 }}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <div>
                        <h2 className="text-xl font-semibold text-white mb-1">
                          Public DIDs <span className="text-sm font-normal opacity-70">(Advanced)</span>
                        </h2>
                        <p className="text-sm text-white opacity-70">
                          For use with the nilAI SDKs. See the {' '}
                          <a 
                            href="https://docs.nillion.com/build/private-llms/usage"
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:opacity-80"
                            style={{ color: 'var(--nillion-primary)' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            docs
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDidSectionExpanded(true)
                        handleCreateDidClick()
                      }}
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
                  {didSectionExpanded && (
                    <>
                      {renderCredentialsTable(dids, 'No DIDs found. Add your first DID to get started.', 'DID')}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
        <Footer />
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
            setGeneratedPrivateKey(null)
            setGeneratedPublicKey(null)
            setError(null)
          }}
        >
          <div 
            className="rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--nillion-bg-secondary)',
              border: '1px solid var(--nillion-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-white mb-4">Add DID</h2>
            
            {/* Mode Selection */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setDidCreationMode('generate')
                  setDidValue('')
                  setGeneratedPrivateKey(null)
                  setGeneratedPublicKey(null)
                }}
                className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: didCreationMode === 'generate' ? 'var(--nillion-primary)' : 'var(--nillion-bg)',
                  color: '#ffffff',
                  border: '1px solid var(--nillion-border)',
                }}
              >
                Generate Keypair
              </button>
              <button
                type="button"
                onClick={() => {
                  setDidCreationMode('enter')
                  setDidValue('')
                  setGeneratedPrivateKey(null)
                  setGeneratedPublicKey(null)
                }}
                className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: didCreationMode === 'enter' ? 'var(--nillion-primary)' : 'var(--nillion-bg)',
                  color: '#ffffff',
                  border: '1px solid var(--nillion-border)',
                }}
              >
                Enter DID
              </button>
            </div>

            {didCreationMode === 'enter' ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-white opacity-80 mb-2">
                    DID (must start with <code className="text-xs">did:nil:</code>)
                  </label>
                  <input
                    type="text"
                    value={didValue}
                    onChange={(e) => {
                      setDidValue(e.target.value)
                      setError(null)
                    }}
                    placeholder="did:nil:..."
                    className="w-full px-4 py-2 rounded-md text-sm font-mono"
                    style={{
                      backgroundColor: 'var(--nillion-bg)',
                      color: '#ffffff',
                      border: '1px solid var(--nillion-border)',
                    }}
                    autoFocus
                  />
                </div>
              </>
            ) : (
              <>
                {!generatedPrivateKey ? (
                  <div className="mb-4">
                    <p className="text-sm text-white opacity-80 mb-4">
                      Generate a new keypair. You'll be shown your private key - save it securely as you'll need it for using the nilAI SDKs.
                    </p>
                    <button
                      type="button"
                      onClick={generateKeypair}
                      className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--nillion-primary)',
                        color: '#ffffff',
                        border: 'none',
                      }}
                    >
                      Generate
                    </button>
                  </div>
                ) : (
                  <div className="mb-4">
                    {/* Warning */}
                    <div 
                      className="mb-4 p-3 rounded-md flex items-start gap-2"
                      style={{ 
                        backgroundColor: 'rgba(251, 191, 36, 0.1)', 
                        border: '1px solid rgba(251, 191, 36, 0.3)'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }}>
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">
                          Save this private key!
                        </p>
                        <p className="text-xs text-white opacity-80">
                          It will not be shown again. You'll need it for using the nilAI SDKs.
                        </p>
                      </div>
                    </div>

                    {/* Private Key Display */}
                    <div className="mb-4">
                      <label className="block text-sm text-white opacity-80 mb-2">Private Key</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={generatedPrivateKey}
                          readOnly
                          className="flex-1 px-4 py-2 rounded-md text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--nillion-bg)',
                            color: '#ffffff',
                            border: '1px solid var(--nillion-border)',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => copyPrivateKey(generatedPrivateKey!)}
                          className="p-2 rounded transition-all duration-300 hover:opacity-90"
                          style={{
                            backgroundColor: copiedPrivateKey 
                              ? 'var(--nillion-primary-lightest)' 
                              : 'transparent',
                            color: copiedPrivateKey 
                              ? 'var(--nillion-primary)' 
                              : '#ffffff',
                            border: '1px solid var(--nillion-border)',
                          }}
                          title="Copy private key"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Public Key (DID) Display */}
                    <div className="mb-4">
                      <label className="block text-sm text-white opacity-80 mb-2">Public Key (DID)</label>
                      <input
                        type="text"
                        value={generatedPublicKey}
                        readOnly
                        className="w-full px-4 py-2 rounded-md text-sm font-mono"
                        style={{
                          backgroundColor: 'var(--nillion-bg)',
                          color: '#ffffff',
                          border: '1px solid var(--nillion-border)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

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
                  setGeneratedPrivateKey(null)
                  setGeneratedPublicKey(null)
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


'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from '@/components/CodeBlock'

function HomeContent() {
  const searchParams = useSearchParams()
  const [apiKey, setApiKey] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCurlPreview, setShowCurlPreview] = useState(false)
  
  // Editable curl parameters
  const [model, setModel] = useState('openai/gpt-oss-20b')
  const [content, setContent] = useState('Tell me a joke')

  // Read API key from query params if present
  useEffect(() => {
    const apiKeyParam = searchParams.get('apiKey')
    if (apiKeyParam) {
      setApiKey(decodeURIComponent(apiKeyParam))
    }
  }, [searchParams])

  const apiUrl = 'https://api.nilai.nillion.network/v1/responses'

  const executeCurl = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key first')
      return
    }

    setIsExecuting(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch('/api/test-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model,
          instructions: 'You are a helpful assistant.',
          input: [
            {
              role: 'user',
              content
            }
          ],
          stream: false,
          web_search: false,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Request failed')
        setResponse(data.details || data)
      } else {
        setResponse(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute request')
    } finally {
      setIsExecuting(false)
    }
  }

  const extractTextContent = (response: any): string => {
    if (!response?.output || !Array.isArray(response.output)) {
      return ''
    }

    // Find the message output
    const messageOutput = response.output.find((item: any) => item.type === 'message')
    if (!messageOutput?.content || !Array.isArray(messageOutput.content)) {
      return ''
    }

    // Extract text from content
    const textContent = messageOutput.content
      .filter((item: any) => item.type === 'output_text' && item.text)
      .map((item: any) => item.text)
      .join('\n')

    return textContent || ''
  }

  const curlCommand = (() => {
    const payload = {
      model,
      instructions: 'You are a helpful assistant.',
      input: [
        {
          role: 'user',
          content
        }
      ],
      stream: false,
      web_search: false
    }
    const jsonPayload = JSON.stringify(payload, null, 2)
    // Escape single quotes for curl command
    const escapedPayload = jsonPayload.replace(/'/g, "'\\''")
    
    return `curl -X 'POST' \\
  '${apiUrl}' \\
  -H 'accept: application/json' \\
  -H 'Authorization: Bearer ${apiKey || 'YOUR_API_KEY_HERE'}' \\
  -H 'Content-Type: application/json' \\
  -d '${escapedPayload}'`
  })()

  return (
    <div className="max-w-6xl">
      <h1 className="mb-2 text-white">
        Developer quickstart
      </h1>
      <p className="mb-8 text-white opacity-80">
        Follow these steps to get started with nilAI.
      </p>

      <div className="space-y-8">
              {/* Primary Flow */}
              {/* Step 1: Get API Key */}
              <div>
                <h2 className="mb-4 text-white">
                  1. Get an API key
                </h2>
                <p className="mb-4 text-white opacity-80 text-sm">
                  Create a key on the API keys page, then use it below.
                </p>
                <div className="mb-4">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value)
                      setError(null)
                    }}
                    placeholder="Paste your API key here"
                    className="w-full px-4 py-2 rounded-md text-sm font-mono"
                    style={{
                      backgroundColor: 'var(--nillion-bg-secondary)',
                      color: '#ffffff',
                      border: '1px solid var(--nillion-border)',
                    }}
                  />
                </div>
                <div className="mb-4">
                  <Link
                    href="/api-keys"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--nillion-primary)',
                      color: '#ffffff',
                      border: 'none',
                    }}
                  >
                    <span>Get an API key (login required)</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="inline-block"
                    >
                      <path
                        d="M6 12L10 8L6 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Step 2: Make Request */}
              <div>
                <h2 className="mb-4 text-white">
                  2. Make your first request
                </h2>
                <p className="mb-4 text-white opacity-80 text-sm">
                  Customize the request parameters below, then execute the curl command to test your API key.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div
                    className="rounded-lg p-6 min-h-[320px] h-full w-full overflow-hidden min-w-0"
                    style={{
                      backgroundColor: 'var(--nillion-bg-secondary)',
                      border: '1px solid var(--nillion-border)',
                    }}
                  >
                    <div>
                      <h3 className="text-base font-semibold text-white">Request</h3>
                      <p className="text-xs text-white opacity-70 mt-1">Configure inputs, then send.</p>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm text-white opacity-80 mb-2">Model</label>
                        <select
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          className="w-full px-4 py-2 rounded-md text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--nillion-bg-secondary)',
                            color: '#ffffff',
                            border: '1px solid var(--nillion-border)',
                          }}
                        >
                          <option value="openai/gpt-oss-20b">openai/gpt-oss-20b</option>
                          <option value="google/gemma-3-27b-it">google/gemma-3-27b-it</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-white opacity-80 mb-2">Input Content</label>
                        <input
                          type="text"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isExecuting && apiKey.trim()) {
                              e.preventDefault()
                              executeCurl()
                            }
                          }}
                          className="w-full px-4 py-2 rounded-md text-sm font-mono"
                          style={{
                            backgroundColor: 'var(--nillion-bg-secondary)',
                            color: '#ffffff',
                            border: '1px solid var(--nillion-border)',
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col items-start gap-3">
                      <button
                        onClick={executeCurl}
                        disabled={isExecuting || !apiKey.trim()}
                        className="px-5 py-2.5 rounded-md text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: 'var(--nillion-primary)',
                          color: '#ffffff',
                          border: 'none',
                        }}
                      >
                        {isExecuting ? 'Executing...' : 'Send Request'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCurlPreview((prev) => !prev)}
                        className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-90 focus:outline-none"
                        style={{
                          color: '#ffffff',
                          backgroundColor: 'transparent',
                          border: 'none',
                          padding: 0,
                          boxShadow: 'none',
                          transform: 'none',
                          appearance: 'none',
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform duration-200 ${showCurlPreview ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        <span>CURL preview</span>
                      </button>

                      {showCurlPreview && (
                        <div className="w-full max-w-full min-w-0 mt-2">
                          <CodeBlock enhanced={true} code={curlCommand} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="rounded-lg p-6 space-y-4 min-h-[320px] h-full"
                    style={{
                      backgroundColor: 'var(--nillion-bg-secondary)',
                      border: '1px solid var(--nillion-border)',
                    }}
                  >
                    <div>
                      <h3 className="text-base font-semibold text-white">Result</h3>
                      <p className="text-xs text-white opacity-70 mt-1">Response or error appears here.</p>
                    </div>

                    {!response && !error && (
                      <div
                        className="rounded-md p-4 text-sm text-white opacity-70"
                        style={{ border: '1px dashed var(--nillion-border)' }}
                      >
                        No response yet. Send a request to see output.
                      </div>
                    )}

                    {error && (
                      <div className="p-4 rounded-md overflow-y-auto" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <p className="text-sm text-red-400 font-semibold mb-2">Error</p>
                        <p className="text-sm text-red-300">{error}</p>
                        {response && (
                          <pre className="mt-2 text-xs text-red-200 overflow-x-auto">
                            {JSON.stringify(response, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}

                    {response && !error && (
                      <div className="p-4 rounded-md overflow-y-auto" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                        <p className="text-sm text-green-400 font-semibold mb-3">Response</p>
                        <div className="text-sm text-white">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Style markdown elements
                              p: ({ children }) => <p className="mb-3 last:mb-0 text-white">{children}</p>,
                              h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-6 first:mt-0 text-white">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-bold mb-3 mt-5 first:mt-0 text-white">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-4 first:mt-0 text-white">{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc list-outside mb-3 ml-6 space-y-1 text-white">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-outside mb-3 ml-6 space-y-1 text-white">{children}</ol>,
                              li: ({ children }) => <li className="text-white">{children}</li>,
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-4">
                                  <table className="border-collapse border border-white/20 w-full">{children}</table>
                                </div>
                              ),
                              thead: ({ children }) => <thead className="bg-white/10">{children}</thead>,
                              tbody: ({ children }) => <tbody>{children}</tbody>,
                              tr: ({ children }) => <tr className="border-b border-white/20">{children}</tr>,
                              th: ({ children }) => <th className="border border-white/20 px-4 py-2 text-left font-semibold text-white">{children}</th>,
                              td: ({ children }) => <td className="border border-white/20 px-4 py-2 text-white">{children}</td>,
                              code: ({ children }) => (
                                <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', color: '#ffffff' }}>
                                  {children}
                                </code>
                              ),
                              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                              em: ({ children }) => <em className="italic text-white">{children}</em>,
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-white/30 pl-4 my-3 italic text-white/90">
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {extractTextContent(response) || 'No text content found'}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl">
        <p className="text-white opacity-80">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

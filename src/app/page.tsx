'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CodeBlock from '@/components/CodeBlock'

function HomeContent() {
  const searchParams = useSearchParams()
  const [apiKey, setApiKey] = useState('')
  const leftColumnRef = useRef<HTMLDivElement>(null)
  const rightColumnRef = useRef<HTMLDivElement>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
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

  // Match right column height to left column height
  useEffect(() => {
    const updateHeight = () => {
      if (leftColumnRef.current && rightColumnRef.current) {
        const leftHeight = leftColumnRef.current.offsetHeight
        rightColumnRef.current.style.height = `${leftHeight}px`
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    
    // Also update when response changes
    const timeoutId = setTimeout(updateHeight, 100)

    return () => {
      window.removeEventListener('resize', updateHeight)
      clearTimeout(timeoutId)
    }
  }, [response, error, model, content])

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--nillion-bg)' }}>
      <Sidebar />
      <div className="ml-64 flex flex-col flex-1">
        <Header />
        <main className="p-8 flex-1">
          <div className="max-w-4xl">
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

              {/* Step 2: Execute curl */}
              <div>
                <h2 className="mb-4 text-white">
                  2. Make your first request
                </h2>
                <p className="mb-4 text-white opacity-80 text-sm">
                  Customize the request parameters below, then execute the curl command to test your API key.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left column: Parameters and Code */}
                  <div ref={leftColumnRef} className="space-y-4">
                    <div className="space-y-4">
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
                        <label className="block text-sm text-white opacity-80 mb-2">Content</label>
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
                    
                    <CodeBlock enhanced={true} code={curlCommand} />
                  </div>

                  {/* Right column: Execute Button and Response */}
                  <div ref={rightColumnRef} className="space-y-4 flex flex-col">
                    {/* Execute Request Text and Button - always visible */}
                    <div className="space-y-4 shrink-0">
                      <p className="text-center text-white text-sm font-medium">Execute Request</p>
                      <button
                        onClick={executeCurl}
                        disabled={isExecuting || !apiKey.trim()}
                        className="w-full px-6 py-4 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
                        style={{
                          background: 'linear-gradient(135deg, var(--nillion-primary) 0%, #3b82f6 100%)',
                          color: '#ffffff',
                          border: 'none',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isExecuting ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Executing...
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                              </svg>
                              Send Request
                            </>
                          )}
                        </span>
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      </button>
                    </div>

                    {/* Error Response - shown below button */}
                    {error && (
                      <div className="p-4 rounded-md flex-1 min-h-0 overflow-y-auto" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <p className="text-sm text-red-400 font-semibold mb-2">Error</p>
                        <p className="text-sm text-red-300">{error}</p>
                        {response && (
                          <pre className="mt-2 text-xs text-red-200 overflow-x-auto">
                            {JSON.stringify(response, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* Success Response - shown below button */}
                    {response && !error && (
                      <div className="p-4 rounded-md flex-1 min-h-0 overflow-y-auto" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
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
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--nillion-bg)' }}>
        <Sidebar />
        <div className="ml-64 flex flex-col flex-1">
          <Header />
          <main className="p-8 flex-1">
            <div className="max-w-4xl">
              <p className="text-white opacity-80">Loading...</p>
            </div>
          </main>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

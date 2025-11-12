'use client'

import { useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="relative group">
      <div 
        className="rounded-lg p-4 pr-12 relative" 
        style={{ 
          backgroundColor: 'var(--nillion-primary-lightest)', 
          border: '1px solid var(--nillion-primary-lighter)' 
        }}
      >
        <pre className="text-sm overflow-x-auto m-0" style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 px-3 py-1.5 text-xs font-medium rounded transition-opacity opacity-0 group-hover:opacity-100 hover:opacity-100"
          style={{ 
            backgroundColor: 'var(--nillion-primary)', 
            color: 'white',
            border: 'none',
          }}
          type="button"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}


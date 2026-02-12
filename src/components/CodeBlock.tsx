'use client'

import { useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
  enhanced?: boolean
}

export default function CodeBlock({ code, language, enhanced = false }: CodeBlockProps) {
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

  // Enhanced styling for code-like appearance
  if (enhanced) {
    // Syntax highlighting with subtle, professional colors
    const highlightCode = (text: string): string => {
      // Escape HTML first
      let highlighted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      
      // Process line by line to handle comments properly
      const lines = highlighted.split('\n')
      const processedLines = lines.map(line => {
        // Check if line is a comment
        const commentMatch = line.match(/^(\s*)(\/\/|#)(.*)$/)
        if (commentMatch) {
          return `${commentMatch[1]}<span style="color: #858585;">${commentMatch[2]}${commentMatch[3]}</span>`
        }
        
        // Process non-comment lines
        let processedLine = line
        
        // Strings - warm but muted orange
        processedLine = processedLine.replace(/(["'`])((?:(?=(\\?))\3.)*?)\1/g, '<span style="color: #CE9178;">$1$2$1</span>')
        
        // Keywords - muted blue
        const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'import', 'from', 'export', 'default', 'return', 'if', 'else', 'for', 'while', 'class', 'new', 'this', 'true', 'false', 'null', 'undefined', 'def', 'print', 'try', 'catch', 'throw']
        keywords.forEach(keyword => {
          const regex = new RegExp(`\\b(${keyword})\\b`, 'g')
          processedLine = processedLine.replace(regex, (match, p1) => {
            // Don't replace if already inside a span
            if (match.includes('<span')) return match
            return `<span style="color: #4EC9B0;">${p1}</span>`
          })
        })
        
        // Numbers - subtle green
        processedLine = processedLine.replace(/\b(\d+\.?\d*)\b/g, (match, p1) => {
          if (match.includes('<span')) return match
          return `<span style="color: #B5CEA8;">${p1}</span>`
        })
        
        return processedLine
      })
      
      return processedLines.join('\n')
    }

    return (
      <div className="relative group w-full max-w-full">
        <div 
          className="rounded-lg p-4 pr-12 relative w-full max-w-full overflow-hidden" 
          style={{ 
            backgroundColor: '#1e1e2e',
            border: '1px solid #3a3a4a',
          }}
        >
          <pre className="text-sm overflow-x-auto m-0 w-full" style={{ color: '#d4d4d4', fontFamily: 'monospace', lineHeight: '1.6' }}>
            <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
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

  // Default styling
  return (
    <div className="relative group w-full max-w-full">
      <div 
        className="rounded-lg p-4 pr-12 relative w-full max-w-full overflow-hidden" 
        style={{ 
          backgroundColor: 'var(--nillion-primary-lightest)', 
          border: '1px solid var(--nillion-primary-lighter)' 
        }}
      >
        <pre className="text-sm overflow-x-auto m-0 w-full" style={{ color: '#1e3a8a', fontFamily: 'monospace' }}>
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


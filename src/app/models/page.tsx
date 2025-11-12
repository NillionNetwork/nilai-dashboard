'use client'

import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

const models = [
  {
    name: 'google/gemma-3-27b-it',
    url: 'https://huggingface.co/google/gemma-3-27b-it',
    price: '$0.12',
  },
  {
    name: 'meta-llama/Llama-3.1-8B',
    url: 'https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct',
    price: '$0.6',
  },
  {
    name: 'openai/gpt-oss-20b',
    url: 'https://huggingface.co/openai/gpt-oss-20b',
    price: '$0.6',
  },
]

export default function ModelsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--nillion-bg)' }}>
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-8">
          <div className="max-w-6xl">
            <h1 className="mb-2 text-white">
              Models & Pricing
            </h1>
            <p className="mb-8 text-white opacity-80">
              Explore available models and their pricing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model) => (
                <div
                  key={model.name}
                  className="rounded-lg p-6 transition-all hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--nillion-bg-secondary)',
                    border: '1px solid var(--nillion-border)',
                  }}
                >
                  <h2 className="mb-4 text-white font-medium" style={{ fontSize: '16px' }}>
                    {model.name}
                  </h2>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-white">
                        {model.price}
                      </span>
                      <span className="text-xs text-white opacity-70">
                        per 1M tokens
                      </span>
                    </div>
                  </div>
                  <a
                    href={model.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs transition-opacity hover:opacity-80"
                    style={{ color: 'var(--nillion-primary-light)' }}
                  >
                    View on Hugging Face →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}


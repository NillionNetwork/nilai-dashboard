'use client'

interface ModelPricing {
  prompt_tokens_price: number
  completion_tokens_price: number
  web_search_cost: number
}

interface Model {
  name: string
  url: string
  pricing: ModelPricing
}

const models: Model[] = [
  {
    name: 'google/gemma-3-27b-it',
    url: 'https://huggingface.co/google/gemma-3-27b-it',
    pricing: {
      prompt_tokens_price: 0.15,
      completion_tokens_price: 0.45,
      web_search_cost: 0.05,
    },
  },
  {
    name: 'openai/gpt-oss-20b',
    url: 'https://huggingface.co/openai/gpt-oss-20b',
    pricing: {
      prompt_tokens_price: 0.15,
      completion_tokens_price: 0.45,
      web_search_cost: 0.05,
    },
  },
]

export default function ModelsPage() {
  return (
    <div className="max-w-6xl">
      <h1 className="mb-2 text-white">
        Models
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
            <div className="mb-4 space-y-2">
              <div className="text-xs text-white opacity-70 mb-2">Pricing (per 1M tokens):</div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white opacity-80">Prompt tokens (Input):</span>
                  <span className="text-sm font-semibold text-white">
                    ${model.pricing.prompt_tokens_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white opacity-80">Completion tokens (Output):</span>
                  <span className="text-sm font-semibold text-white">
                    ${model.pricing.completion_tokens_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white opacity-80">Web search:</span>
                  <span className="text-sm font-semibold text-white">
                    ${model.pricing.web_search_cost.toFixed(2)}
                  </span>
                </div>
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
  )
}

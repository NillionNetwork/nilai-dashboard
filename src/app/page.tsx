'use client'

import { useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import CodeBlock from '@/components/CodeBlock'
import Tabs from '@/components/Tabs'

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState<'ts' | 'python'>('ts')
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--nillion-bg)' }}>
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-8">
          <div className="max-w-4xl">
            <h1 className="mb-2 text-white">
              Developer quickstart
            </h1>
            <p className="mb-8 text-white opacity-80">
              Follow these steps to get started with BeBold AI.
            </p>

            <div className="space-y-8">
              {/* Step 1 */}
              <div>
                <h2 className="mb-4 text-white">
                  1. Create and export an API key
                </h2>
                <CodeBlock code='export NILLION_API_KEY="your_api_key_here"' />
                <div className="mt-4">
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

              {/* Step 2 */}
              <div>
                <h2 className="mb-4 text-white">
                  2. Install the SDK
                </h2>
                <Tabs
                  tabs={[
                    { id: 'ts', label: 'TypeScript' },
                    { id: 'python', label: 'Python' },
                  ]}
                  activeTab={selectedLanguage}
                  onTabChange={(tabId) => setSelectedLanguage(tabId as 'ts' | 'python')}
                >
                  {(activeTab) => (
                    <CodeBlock 
                      code={activeTab === 'ts' 
                        ? 'pnpm install @nillion/nilai-ts' 
                        : 'pip install nilai-py'} 
                    />
                  )}
                </Tabs>
              </div>

              {/* Step 3 */}
              <div>
                <h2 className="mb-4 text-white">
                  3. Make a completion
                </h2>
                <CodeBlock 
                  code={selectedLanguage === 'ts' 
                    ? `import "dotenv/config";

import { NilaiOpenAIClient, NilAuthInstance } from "@nillion/nilai-ts";

// To obtain an API key, navigate to https://subscription.nillion.com
// and create a new subscription.
// The API key will be displayed in the subscription details.
// The NilaiOpenAIClient class automatically handles the NUC token creation and management.

const API_KEY = process.env.NILLION_API_KEY;

async function main() {
  // Initialize the client in API key mode
  // For sandbox, use the following:
  const client = new NilaiOpenAIClient({
    baseURL: "https://nilai-a779.nillion.network/v1/",
    apiKey: API_KEY,
    nilauthInstance: NilAuthInstance.SANDBOX,
    // For production, use the following:
    // nilauthInstance: NilAuthInstance.PRODUCTION,
  });

  // Make a request to the Nilai API
  const response = await client.chat.completions.create({
    model: "google/gemma-3-27b-it",
    messages: [
      { role: "user", content: "Hello! Can you help me with something?" }
    ],
  });

  console.log(\`Response: \${response.choices[0].message.content}\`);
}

// Run the example
main().catch(console.error);`
                    : `from nilai_py import Client, NilAuthInstance

from config import API_KEY

def main():
    # Initialize the client in API key mode
    # To obtain an API key, navigate to https://nilpay.vercel.app/
    # and create a new subscription.
    # The API key will be displayed in the subscription details.
    # The Client class automatically handles the NUC token creation and management.
    ## For sandbox, use the following:
    client = Client(
        base_url="https://nilai-a779.nillion.network/nucs/v1/",
        api_key=API_KEY,
        # For production, use the following:
        # nilauth_instance=NilAuthInstance.PRODUCTION,
    )

    # Make a request to the Nilai API
    response = client.chat.completions.create(
        model="google/gemma-3-27b-it",
        messages=[
            {"role": "user", "content": "Hello! Can you help me with something?"}
        ],
    )

    print(f"Response: {response.choices[0].message.content}")

if __name__ == "__main__":
    main()`} 
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

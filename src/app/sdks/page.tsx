'use client'

import { useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CodeBlock from '@/components/CodeBlock'
import Tabs from '@/components/Tabs'

export default function SDKsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<'ts' | 'python'>('ts')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--nillion-bg)' }}>
      <Sidebar />
      <div className="ml-64 flex flex-col flex-1">
        <Header />
        <main className="p-8 flex-1">
          <div className="max-w-4xl">
            <h1 className="mb-2 text-white">
              Using the nilAI SDKs
            </h1>
            <p className="mb-8 text-white opacity-80">
              Follow these steps to integrate nilAI into your application using our SDKs.
            </p>

            <div className="space-y-8">
              {/* Step 1: Register DID */}
              <div>
                <h2 className="mb-4 text-white">
                  1. Register a DID
                </h2>
                <p className="mb-4 text-white opacity-80 text-sm">
                  Go to the API keys page and register a Public DID. Save the private key securely - you'll need it for SDK configuration.
                </p>
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
                    <span>Go to API keys page</span>
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

              {/* Step 2: Install SDK */}
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
                      enhanced={true}
                      code={activeTab === 'ts' 
                        ? 'pnpm install @nillion/nilai-ts' 
                        : 'pip install nilai-py'} 
                    />
                  )}
                </Tabs>
              </div>

              {/* Step 3: Make completion */}
              <div>
                <h2 className="mb-4 text-white">
                  3. Make a completion
                </h2>
                <CodeBlock 
                  enhanced={true}
                  language={selectedLanguage}
                  code={selectedLanguage === 'ts' 
                    ? `import { NilaiOpenAIClient, NilAuthInstance } from "@nillion/nilai-ts";

const API_KEY = "YOUR_PRIVATE_KEY_HERE";

async function main() {
  // Initialize the client in API key mode
  const client = new NilaiOpenAIClient({
    baseURL: "https://api.nilai.nillion.network/nuc/v1/",
    apiKey: API_KEY,
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

API_KEY: str = "YOUR_PRIVATE_KEY_HERE"

def main():
    # Create the OpenAI client with the custom endpoint and API key
    client = Client(
        base_url="https://api.nilai.nillion.network/nuc/v1",
        api_key=API_KEY,
    )

    # Make a request to the nilai API
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "user",
                "content": "Create a story written as a pirate. Write in a pirate accent.",
            }
        ],
        stream=True,
    )

    for chunk in response:
        if chunk.choices[0].finish_reason is not None:
            print("\\n[DONE]")
            break
        if chunk.choices[0].delta.content is not None:
            print(chunk.choices[0].delta.content, end="", flush=True)

if __name__ == "__main__":
    main()`} 
                />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  children: (activeTab: string) => React.ReactNode
  defaultTab?: string
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

export default function Tabs({ tabs, children, defaultTab, activeTab: controlledActiveTab, onTabChange }: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id)
  
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab
  
  const handleTabChange = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId)
    } else {
      setInternalActiveTab(tabId)
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className="px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === tab.id 
                ? 'var(--nillion-primary-lightest)' 
                : 'transparent',
              color: activeTab === tab.id 
                ? 'var(--nillion-primary)' 
                : '#ffffff',
              border: activeTab === tab.id
                ? '1px solid var(--nillion-primary-lighter)'
                : '1px solid var(--nillion-border)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {children(activeTab)}
      </div>
    </div>
  )
}


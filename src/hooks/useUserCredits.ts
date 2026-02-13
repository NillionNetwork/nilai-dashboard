import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'

export function useUserCredits() {
  const { authenticated, user, ready, getAccessToken } = usePrivy()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCredits = async () => {
      if (!ready || !authenticated || !user) {
        setBalance(null)
        return
      }

      setLoading(true)
      try {
        const token = await getAccessToken()
        const response = await fetch(`/api/users/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setBalance(data.balance ?? 0)
        } else {
          console.error('Failed to fetch credits')
          setBalance(0)
        }
      } catch (error) {
        console.error('Error fetching credits:', error)
        setBalance(0)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()

    // Refresh credits every 30 seconds when authenticated
    let interval: NodeJS.Timeout | null = null
    if (authenticated) {
      interval = setInterval(fetchCredits, 30000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [ready, authenticated, user])

  return { balance, loading }
}


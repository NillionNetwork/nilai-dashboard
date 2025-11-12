import { useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'

export function useCreateUser() {
  const { authenticated, user, ready } = usePrivy()
  const hasCreatedUser = useRef(false)

  useEffect(() => {
    if (ready && authenticated && user && !hasCreatedUser.current) {
      const checkAndCreateUser = async () => {
        try {
          const privyId = user.id
          
          // First, check if user already exists
          const checkResponse = await fetch(`/api/users/${privyId}`)
          
          if (checkResponse.ok) {
            // User already exists
            hasCreatedUser.current = true
            console.log('User already exists in credit service')
            return
          }
          
          // If user doesn't exist (404), create them
          if (checkResponse.status === 404) {
            const createResponse = await fetch('/api/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: privyId,
              }),
            })

            if (createResponse.ok) {
              hasCreatedUser.current = true
              console.log('User created successfully in credit service')
            } else {
              const error = await createResponse.json()
              console.error('Failed to create user:', error)
            }
          } else {
            // Some other error occurred
            const error = await checkResponse.json()
            console.error('Error checking user:', error)
          }
        } catch (error) {
          console.error('Error checking/creating user:', error)
        }
      }

      checkAndCreateUser()
    }

    // Reset when user logs out
    if (!authenticated) {
      hasCreatedUser.current = false
    }
  }, [ready, authenticated, user])
}


'use client'

import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import LoginPage from '@/components/LoginPage'
import PlantTracker from '@/components/PlantTracker'

function App() {
  const { token, login, logout } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if the token is valid (you might want to implement a more robust check)
    setLoading(false)
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {token ? (
        <>
          <button onClick={logout} className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white rounded">
            Logout
          </button>
          <PlantTracker />
        </>
      ) : (
        <LoginPage onLogin={login} />
      )}
    </div>
  )
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}
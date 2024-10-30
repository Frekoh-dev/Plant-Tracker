'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function SessionDebugger() {
  const { data: session, status } = useSession()
  const [cookieInfo, setCookieInfo] = useState<string | null>(null)
  const [allCookies, setAllCookies] = useState<string>('')
  const [secureSessionCookie, setSecureSessionCookie] = useState<string | null>(null)

  useEffect(() => {
    const getCookies = () => {
      const cookies = document.cookie.split(';').map(cookie => cookie.trim())
      setAllCookies(cookies.join(', '))

      const sessionCookie = cookies.find(cookie => 
        cookie.startsWith('next-auth.session-token=')
      )
      setCookieInfo(sessionCookie || null)

      const secureSessionCookieValue = cookies.find(cookie => 
        cookie.startsWith('__Secure-next-auth.session-token=')
      )
      setSecureSessionCookie(secureSessionCookieValue || null)
    }

    getCookies()
    const intervalId = setInterval(getCookies, 1000)
    return () => clearInterval(intervalId)
  }, [status])

  return (
    <div className="p-4 bg-gray-100 rounded-lg mt-4">
      <h2 className="text-lg font-semibold mb-2">Session Debug Info</h2>
      <p>Status: {status}</p>
      <p>Session Cookie: {cookieInfo || 'Not found'}</p>
      <p>Secure Session Cookie: {secureSessionCookie || 'Not found'}</p>
      <p>All Cookies: {allCookies}</p>
      <p>NEXTAUTH_URL: {process.env.NEXT_PUBLIC_NEXTAUTH_URL}</p>
      <p>NODE_ENV: {process.env.NODE_ENV}</p>
      {session && (
        <>
          <p>Session Expires: {session.expires}</p>
          <p>Current Time: {new Date().toISOString()}</p>
          <p>Time Until Expiry: {session.expires ? `${Math.floor((new Date(session.expires).getTime() - Date.now()) / 1000 / 60)} minutes` : 'N/A'}</p>
          <pre className="mt-2 p-2 bg-white rounded overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </>
      )}
    </div>
  )
}
'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function SessionDebug() {
  const { data: session, status } = useSession()
  const [cookieInfo, setCookieInfo] = useState<string | null>(null)

  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('next-auth.session-token='))

    if (sessionCookie) {
      setCookieInfo(sessionCookie)
    }
  }, [status])

  return (
    <div className="p-4 bg-gray-100 rounded-lg mt-4">
      <h2 className="text-lg font-semibold mb-2">Session Debug Info</h2>
      <p>Status: {status}</p>
      <p>Session Cookie: {cookieInfo || 'Not found'}</p>
      {session && (
        <pre className="mt-2 p-2 bg-white rounded">
          {JSON.stringify(session, null, 2)}
        </pre>
      )}
    </div>
  )
}
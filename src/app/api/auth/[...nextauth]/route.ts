import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest } from 'next/server'

async function handler(req: NextRequest) {
  const res = await NextAuth(authOptions)(req)

  // Log the session cookie after it's set
  const cookies = res.headers.get('Set-Cookie')
  if (cookies) {
    console.log('Session cookie set:', cookies)
  }

  return res
}

export { handler as GET, handler as POST }
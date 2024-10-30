import NextAuth from "next-auth"
import { authOptions, logSessionCookie } from "@/lib/auth"

const handler = NextAuth(authOptions)

export async function GET(request: Request) {
  const response = await handler(request)
  logSessionCookie(response)
  return response
}

export async function POST(request: Request) {
  const response = await handler(request)
  logSessionCookie(response)
  return response
}
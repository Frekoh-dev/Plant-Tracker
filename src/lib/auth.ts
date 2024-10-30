import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { compare } from "bcrypt"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }
        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username
          }
        })
        if (!user) {
          return null
        }
        const isPasswordValid = await compare(credentials.password, user.password)
        if (!isPasswordValid) {
          return null
        }
        return {
          id: user.id,
          username: user.username,
          email: user.email,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        // Set token expiry
        token.exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        // Ensure session expiry is set correctly
        session.expires = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
      }
      return session
    }
  },
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        domain: process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : undefined,
        expires: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now
      }
    }
  },
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}
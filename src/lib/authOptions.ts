import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
async authorize(credentials) {
  console.log("Authorize function called")
  if (!credentials?.username || !credentials?.password) {
    console.log("Missing credentials")
    return null
  }

  const user = await prisma.user.findUnique({
    where: { username: credentials.username },
  })

  if (!user || !user.password) {
    console.log("User not found or password not set")
    return null
  }

  const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

  if (!isPasswordValid) {
    console.log("Invalid password")
    return null
  }

  console.log("User authenticated successfully")
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  }
}
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
import 'next-auth'

declare module 'next-auth' {
  interface User {
    username: string
    // Add any other custom properties your user object might have
  }

  interface Session {
    user: User & {
      id: string
    }
  }
}
const TOKEN_KEY = 'access_token'

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY)
    console.log('Retrieved token:', token ? `${token.substring(0, 8)}...` : 'null')
    return token
  }
  console.log('getToken called server-side')
  return null
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
    console.log('Token set in localStorage:', `${token.substring(0, 8)}...`)
  } else {
    console.log('setToken called server-side')
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    console.log('Token removed from localStorage')
  } else {
    console.log('removeToken called server-side')
  }
}

export function isTokenExpired(token: string): boolean {
  if (!token) {
    console.log('No token provided to isTokenExpired')
    return true
  }

  // For UUID tokens, we can't check expiration based on the token itself
  // You might want to implement a separate mechanism to track token expiration
  console.log('Token expiration check: Unable to determine expiration for UUID token')
  return false
}

export function getTokenExpirationTime(token: string): number | null {
  if (!token) {
    console.log('No token provided to getTokenExpirationTime')
    return null
  }

  // For UUID tokens, we can't determine expiration time from the token itself
  console.log('Token expiration time: Unable to determine for UUID token')
  return null
}
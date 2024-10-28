import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface DecodedToken {
  userId: string
  username: string
  iat: number
  exp: number
}

export function verifyJwtToken(token: string): Promise<DecodedToken> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return reject(err)
      }
      resolve(decoded as DecodedToken)
    })
  })
}

export function generateJwtToken(payload: { userId: string; username: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' })
}
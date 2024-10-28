import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export function signJwtToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' })
}

export async function verifyJwtToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('JWT Verification Error:', err)
        reject(err)
      } else {
        resolve(decoded)
      }
    })
  })
}
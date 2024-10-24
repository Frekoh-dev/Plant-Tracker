import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function getPrismaClient() {
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient()
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      })
    }
    return global.prisma
  }
}

const prisma = getPrismaClient()

prisma.$connect()
  .then(() => console.log('Successfully connected to the database'))
  .catch((e) => console.error('Failed to connect to the database', e))

export default prisma
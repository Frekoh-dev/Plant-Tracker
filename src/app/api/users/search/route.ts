import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query.toLowerCase(),
        },
      },
      select: {
        id: true,
        username: true,
      },
      take: 10,
    })

    console.log(`User search for "${query}" returned ${users.length} results`)

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'An error occurred while searching for users' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
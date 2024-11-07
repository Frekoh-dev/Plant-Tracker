import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        plants: {
          include: {
            protocolEntries: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user plants:', error)
    return NextResponse.json({ error: 'An error occurred while fetching user plants' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
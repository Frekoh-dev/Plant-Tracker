import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plantId = parseInt(params.id, 10)
    if (isNaN(plantId)) {
      return NextResponse.json({ error: 'Invalid plant ID' }, { status: 400 })
    }

    const { withFertilizer } = await request.json()

    const updatedPlant = await prisma.plant.update({
      where: {
        id: plantId,
        userId: session.user.id, // Assuming the user id is stored in the session
      },
      data: {
        lastWatered: new Date(),
        protocolEntries: {
          create: {
            description: `Plant watered${withFertilizer ? ' with fertilizer' : ''}`
          }
        }
      },
      include: {
        protocolEntries: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    })

    return NextResponse.json(updatedPlant)
  } catch (error) {
    console.error('Error watering plant:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
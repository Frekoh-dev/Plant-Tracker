import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
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

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        protocolEntries: {
          orderBy: {
            createdAt: 'desc'
          },
        },
      },
    })

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    if (plant.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json(plant.protocolEntries)
  } catch (error) {
    console.error('Error fetching protocol entries:', error)
    return NextResponse.json({ error: 'Failed to fetch protocol entries' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
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

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
    })

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    if (plant.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { description } = await request.json()

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    await prisma.protocolEntry.create({
      data: {
        description,
        plantId,
      },
    })

    const updatedPlant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        protocolEntries: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
      },
    })

    return NextResponse.json(updatedPlant)
  } catch (error) {
    console.error('Error creating protocol entry:', error)
    return NextResponse.json({ error: 'Failed to create protocol entry' }, { status: 500 })
  }
}
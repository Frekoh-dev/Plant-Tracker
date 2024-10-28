import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plantId = parseInt(params.id)
    const entryId = parseInt(params.entryId)

    if (isNaN(plantId) || isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid plant ID or entry ID' }, { status: 400 })
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

    await prisma.protocolEntry.delete({
      where: { id: entryId, plantId: plantId },
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
    console.error('Error deleting protocol entry:', error)
    return NextResponse.json({ error: 'Failed to delete protocol entry' }, { status: 500 })
  }
}
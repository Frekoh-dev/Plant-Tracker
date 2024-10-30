import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type SanitizedPlantData = Prisma.PlantUpdateInput

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PATCH /api/plants/[id]/harvest: Updating plant harvest details')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('PATCH /api/plants/[id]/harvest: Unauthorized')
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

    const body = await request.json()

    const sanitizedData: SanitizedPlantData = {
      isHarvested: true,
      harvestedAmount: body.harvestedAmount || 0,
    }

    if (body.harvestedAt) {
      sanitizedData.ripeningDate = new Date(body.harvestedAt)
    }

    console.log('PATCH /api/plants/[id]/harvest: Updating plant harvest details', { plantId, ...sanitizedData })

    const updatedPlant = await prisma.plant.update({
      where: { id: plantId },
      data: sanitizedData,
    })

    console.log('PATCH /api/plants/[id]/harvest: Plant harvest details updated successfully')
    return NextResponse.json(updatedPlant)
  } catch (error) {
    console.error('PATCH /api/plants/[id]/harvest: Error updating plant harvest details:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PlantStage, Prisma } from '@prisma/client'


type SanitizedPlantData = Prisma.PlantUpdateInput

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET /api/plants/[id]: Fetching plant details')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('GET /api/plants/[id]: Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plantId = parseInt(params.id, 10)
    if (isNaN(plantId)) {
      return NextResponse.json({ error: 'Invalid plant ID' }, { status: 400 })
    }

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: { protocolEntries: true, images: true },
    })

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    if (plant.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    console.log('GET /api/plants/[id]: Plant details fetched successfully')
    return NextResponse.json(plant)
  } catch (error) {
    console.error('GET /api/plants/[id]: Error fetching plant details:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PATCH /api/plants/[id]: Updating plant details')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('PATCH /api/plants/[id]: Unauthorized')
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

    const validFields = [
      'name',
      'species',
      'stage',
      'imageUrl',
      'isHarvested',
      'harvestedAmount',
      'lastWatered',
      'seedDate',
      'seedlingDate',
      'vegetativeDate',
      'floweringDate',
      'ripeningDate',
    ] as const

    const sanitizedData: SanitizedPlantData = {}

    for (const key of validFields) {
      if (key in body) {
        if (key === 'stage') {
          const stageValue = body[key] as PlantStage
          if (!Object.values(PlantStage).includes(stageValue)) {
            console.log('PATCH /api/plants/[id]: Invalid plant stage', { stage: stageValue })
            return NextResponse.json({ error: 'Invalid plant stage' }, { status: 400 })
          }
          sanitizedData.stage = stageValue

          const currentDate = new Date()
          switch (stageValue) {
            case PlantStage.SEED:
              sanitizedData.seedDate = { set: currentDate }
              break
            case PlantStage.SEEDLING:
              sanitizedData.seedlingDate = { set: currentDate }
              break
            case PlantStage.VEGETATIVE:
              sanitizedData.vegetativeDate = { set: currentDate }
              break
            case PlantStage.FLOWERING:
              sanitizedData.floweringDate = { set: currentDate }
              break
            case PlantStage.RIPENING:
              sanitizedData.ripeningDate = { set: currentDate }
              break
          }
        } else if (key === 'lastWatered') {
          sanitizedData.lastWatered = body[key] ? { set: new Date(body[key]).toISOString() } : null
        } else if (key.endsWith('Date')) {
          switch (key) {
            case 'seedDate':
            case 'seedlingDate':
            case 'vegetativeDate':
            case 'floweringDate':
            case 'ripeningDate':
              sanitizedData[key] = {
                set: body[key] ? new Date(body[key] as string) : null
              }
              break
            default:
              console.warn(`Unexpected date field: ${key}`)
          }
        } else if (key === 'isHarvested') {
          sanitizedData.isHarvested = { set: Boolean(body[key]) }
        } else if (key === 'harvestedAmount') {
          sanitizedData.harvestedAmount = body[key] !== null ? { set: Math.round(Number(body[key])) } : { set: null }
        } else {
          // For string fields (name, species, imageUrl)
          sanitizedData[key as 'name' | 'species' | 'imageUrl'] = { set: body[key] }
        }
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    console.log('PATCH /api/plants/[id]: Updating plant details', { plantId, ...sanitizedData })

    const updatedPlant = await prisma.plant.update({
      where: { id: plantId },
      data: sanitizedData,
    })

    console.log('PATCH /api/plants/[id]: Plant details updated successfully')
    return NextResponse.json(updatedPlant)
  } catch (error) {
    console.error('PATCH /api/plants/[id]: Error updating plant details:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // For full updates, we can reuse the PATCH logic
  return PATCH(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE /api/plants/[id]: Deleting plant')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('DELETE /api/plants/[id]: Unauthorized')
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

    console.log('DELETE /api/plants/[id]: Deleting plant and related records', { plantId })

    await prisma.$transaction(async (prisma) => {
      await prisma.protocolEntry.deleteMany({
        where: {
          plantId: plantId,
        },
      })

      await prisma.plantImage.deleteMany({
        where: {
          plantId: plantId,
        },
      })

      await prisma.plant.delete({
        where: { id: plantId },
      })
    })

    console.log('DELETE /api/plants/[id]: Plant and related records deleted successfully')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/plants/[id]: Error deleting plant:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
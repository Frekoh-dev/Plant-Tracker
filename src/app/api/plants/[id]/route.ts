import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

// Define PlantStage enum directly in this file
enum PlantStage {
  SEED = 'SEED',
  SEEDLING = 'SEEDLING',
  VEGETATIVE = 'VEGETATIVE',
  FLOWERING = 'FLOWERING',
  RIPENING = 'RIPENING'
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PATCH /api/plants/[id]: Updating plant details')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('PATCH /api/plants/[id]: Unauthorized')
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const plantId = parseInt(params.id, 10)
    if (isNaN(plantId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid plant ID' }),
        { status: 400 }
      )
    }

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
    })

    if (!plant) {
      return new NextResponse(
        JSON.stringify({ error: 'Plant not found' }),
        { status: 404 }
      )
    }

    if (plant.userId !== session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate and sanitize input
    const validFields = [
      'name',
      'species',
      'stage',
      'imageUrl',
      'isHarvested',
      'harvestedAmount',
      'seedDate',
      'seedlingDate',
      'vegetativeDate',
      'floweringDate',
      'ripeningDate',
    ]

    const sanitizedData: Record<string, any> = {}

    for (const [key, value] of Object.entries(body)) {
      if (validFields.includes(key)) {
        if (key === 'stage') {
          if (!Object.values(PlantStage).includes(value as PlantStage)) {
            console.log('PATCH /api/plants/[id]: Invalid plant stage', { stage: value })
            return new NextResponse(
              JSON.stringify({ error: 'Invalid plant stage' }),
              { status: 400 }
            )
          }
          sanitizedData[key] = value

          // Update the corresponding date field for the new stage
          const currentDate = new Date().toISOString()
          switch (value) {
            case PlantStage.SEED:
              sanitizedData['seedDate'] = currentDate
              break
            case PlantStage.SEEDLING:
              sanitizedData['seedlingDate'] = currentDate
              break
            case PlantStage.VEGETATIVE:
              sanitizedData['vegetativeDate'] = currentDate
              break
            case PlantStage.FLOWERING:
              sanitizedData['floweringDate'] = currentDate
              break
            case PlantStage.RIPENING:
              sanitizedData['ripeningDate'] = currentDate
              break
          }
        } else if (key.endsWith('Date') && value) {
          // Ensure dates are in ISO format
          sanitizedData[key] = new Date(value).toISOString()
        } else {
          sanitizedData[key] = value
        }
      }
    }

    // Ensure we have data to update
    if (Object.keys(sanitizedData).length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No valid fields to update' }),
        { status: 400 }
      )
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
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE /api/plants/[id]: Deleting plant')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('DELETE /api/plants/[id]: Unauthorized')
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const plantId = parseInt(params.id, 10)
    if (isNaN(plantId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid plant ID' }),
        { status: 400 }
      )
    }

    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
    })

    if (!plant) {
      return new NextResponse(
        JSON.stringify({ error: 'Plant not found' }),
        { status: 404 }
      )
    }

    if (plant.userId !== session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403 }
      )
    }

    console.log('DELETE /api/plants/[id]: Deleting plant and related records', { plantId })

    // Start a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (prisma) => {
      // Delete related protocol entries (if this model exists)
      if (prisma.protocolEntry) {
        await prisma.protocolEntry.deleteMany({
          where: {
            plantId: plantId,
          },
        })
      }

      // Delete related images (if this model exists)
      if (prisma.plantImage) {
        await prisma.plantImage.deleteMany({
          where: {
            plantId: plantId,
          },
        })
      }

      // Finally, delete the plant
      await prisma.plant.delete({
        where: { id: plantId },
      })
    })

    console.log('DELETE /api/plants/[id]: Plant and related records deleted successfully')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/plants/[id]: Error deleting plant:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    )
  }
}
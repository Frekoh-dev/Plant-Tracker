import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plantId = parseInt(params.id, 10)
    const imageId = parseInt(params.imageId, 10)

    if (isNaN(plantId) || isNaN(imageId)) {
      return NextResponse.json({ error: 'Invalid plant ID or image ID' }, { status: 400 })
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

    await prisma.plantImage.delete({
      where: {
        id: imageId,
        plantId,
      },
    })

    return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  console.log(`Received request with params:`, params)
  
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('Unauthorized: No valid session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plantId = parseInt(params.id, 10)
    const imageId = parseInt(params.imageId, 10)

    console.log(`Parsed IDs - Plant ID: ${plantId}, Image ID: ${imageId}`)

    if (isNaN(plantId)) {
      console.log('Invalid plant ID')
      return NextResponse.json({ error: 'Invalid plant ID' }, { status: 400 })
    }

    if (isNaN(imageId)) {
      console.log('Invalid image ID')
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 })
    }

    const image = await prisma.plantImage.findUnique({
      where: {
        id: imageId,
        plantId: plantId,
      },
      select: {
        id: true,
        imageUrl: true,
        width: true,
        height: true,
      },
    })

    console.log('Database query result:', image)

    if (!image) {
      console.log('Image not found')
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    if (!image.imageUrl) {
      console.log('Image URL is missing')
      return NextResponse.json({ error: 'Image URL is missing' }, { status: 500 })
    }

    console.log('Returning image data:', image)
    return NextResponse.json(image)
  } catch (error) {
    console.error('Error fetching image:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
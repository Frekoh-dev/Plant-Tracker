import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const plantId = parseInt(params.id, 10)
    const imageId = parseInt(params.imageId, 10)

    if (isNaN(plantId) || isNaN(imageId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid plant ID or image ID' }),
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

    await prisma.plantImage.delete({
      where: {
        id: imageId,
        plantId,
      },
    })

    return new NextResponse(
      JSON.stringify({ message: 'Image deleted successfully' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting image:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    )
  }
}
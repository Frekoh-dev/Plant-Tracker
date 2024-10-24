import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
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
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const plantId = parseInt(params.id)
    const imageId = parseInt(params.imageId)

    await prisma.galleryImage.delete({
      where: { id: imageId, plantId: plantId },
    })

    const updatedPlant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        galleryImages: true,
      },
    })

    return NextResponse.json(updatedPlant)
  } catch (error) {
    console.error('Error deleting gallery image:', error)
    return NextResponse.json({ error: 'Failed to delete gallery image' }, { status: 500 })
  }
}
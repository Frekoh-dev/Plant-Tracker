import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const plantId = parseInt(params.id)
    const entryId = parseInt(params.entryId)

    await prisma.protocolEntry.delete({
      where: { id: entryId, plantId: plantId },
    })

    const updatedPlant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        protocol: true,
      },
    })

    return NextResponse.json(updatedPlant)
  } catch (error) {
    console.error('Error deleting protocol entry:', error)
    return NextResponse.json({ error: 'Failed to delete protocol entry' }, { status: 500 })
  }
}
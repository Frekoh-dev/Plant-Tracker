import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const body = await request.json()

  try {
    const updatedPlant = await prisma.plant.update({
      where: { id },
      data: { stage: body.stage },
    })

    return NextResponse.json(updatedPlant)
  } catch (error) {
    console.error('Error updating plant:', error)
    return NextResponse.json({ error: 'Failed to update plant' }, { status: 500 })
  }
}
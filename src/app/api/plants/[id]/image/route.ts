import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth"

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const plantId = parseInt(params.id, 10)
    if (isNaN(plantId)) {
      return NextResponse.json({ error: 'Invalid plant ID' }, { status: 400 })
    }

    const formData = await request.formData()
    const image = formData.get('image') as File | null

    if (!image) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Read the file as an ArrayBuffer
    const arrayBuffer = await image.arrayBuffer()
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(arrayBuffer)
    // Convert Buffer to base64 string
    const base64Image = buffer.toString('base64')

    // Update the plant with the new image data
    const updatedPlant = await prisma.plant.update({
      where: { id: plantId },
      data: { imageUrl: `data:${image.type};base64,${base64Image}` }
    })

    return NextResponse.json(updatedPlant)

  } catch (error) {
    console.error('Error uploading plant image:', error)
    return NextResponse.json({ error: 'An error occurred while uploading the image' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
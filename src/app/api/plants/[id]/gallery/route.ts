import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

async function getUserIdFromToken(request: Request) {
  const token = request.headers.get('Authorization')?.split(' ')[1]
  if (!token) {
    throw new Error('No token provided')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    return decoded.userId
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const plantId = Number(id)

  try {
    const userId = await getUserIdFromToken(request)
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
    })

    if (!plant || plant.userId !== userId) {
      return NextResponse.json({ message: 'Plant not found or unauthorized' }, { status: 404 })
    }

    const { imageBase64 } = await request.json()
    if (!imageBase64) {
      return NextResponse.json({ message: 'No image provided' }, { status: 400 })
    }

    // Create a new gallery image
    const newGalleryImage = await prisma.galleryImage.create({
      data: {
        url: imageBase64,
        plantId: plantId,
      },
    })

    return NextResponse.json(newGalleryImage)
  } catch (error) {
    console.error('Error uploading gallery image:', error)
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Error uploading gallery image', error: error.message }, { status: 500 })
    }
    return NextResponse.json({ message: 'Error uploading gallery image', error: String(error) }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const plantId = Number(id)

  try {
    const userId = await getUserIdFromToken(request)
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      include: { galleryImages: true },
    })

    if (!plant || plant.userId !== userId) {
      return NextResponse.json({ message: 'Plant not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json(plant.galleryImages)
  } catch (error) {
    console.error('Error fetching gallery images:', error)
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Error fetching gallery images', error: error.message }, { status: 500 })
    }
    return NextResponse.json({ message: 'Error fetching gallery images', error: String(error) }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
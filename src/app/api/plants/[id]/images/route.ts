import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/auth'
import prisma from '@/lib/prisma'
import sharp from 'sharp'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Process full-size image
    const fullSizeImage = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer()

    // Process thumbnail
    const thumbnailImage = await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 60 })
      .toBuffer()

    const imageUrl = `data:image/webp;base64,${fullSizeImage.toString('base64')}`
    const thumbnailUrl = `data:image/webp;base64,${thumbnailImage.toString('base64')}`

    const newImage = await prisma.plantImage.create({
      data: {
        imageUrl,
        thumbnailUrl,
        plantId,
      },
    })

    return NextResponse.json(newImage, { status: 201 })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
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

    const images = await prisma.plantImage.findMany({
      where: {
        plantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(images, { status: 200 })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
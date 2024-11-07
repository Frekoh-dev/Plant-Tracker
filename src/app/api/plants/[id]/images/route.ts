import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/auth'
import prisma from '@/lib/prisma'
import sharp from 'sharp'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Starting image upload process')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plantId = parseInt(params.id, 10)
    if (isNaN(plantId)) {
      console.log('Invalid plant ID:', params.id)
      return NextResponse.json({ error: 'Invalid plant ID' }, { status: 400 })
    }

    console.log('Fetching plant with ID:', plantId)
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
    })

    if (!plant) {
      console.log('Plant not found with ID:', plantId)
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    if (plant.userId !== session.user.id) {
      console.log('Unauthorized access to plant:', plantId)
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      console.log('No file uploaded')
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    console.log('Processing image')
    const buffer = Buffer.from(await file.arrayBuffer())
    const sharpImage = sharp(buffer)
    const metadata = await sharpImage.metadata()

    // Preserve orientation
    const orientedImage = sharpImage.rotate()

    // Process full-size image
    const fullSizeImage = await orientedImage
      .webp({ quality: 80 })
      .toBuffer()

    // Process thumbnail
    const thumbnailImage = await orientedImage
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 60 })
      .toBuffer()

    const imageUrl = `data:image/webp;base64,${fullSizeImage.toString('base64')}`
    const thumbnailUrl = `data:image/webp;base64,${thumbnailImage.toString('base64')}`

    console.log('Creating new plant image record')
    const newImage = await prisma.plantImage.create({
      data: {
        imageUrl,
        thumbnailUrl,
        plantId,
        width: metadata.width,
        height: metadata.height,
      },
    })

    console.log('Image upload successful')
    return NextResponse.json({
      id: newImage.id,
      thumbnailUrl: newImage.thumbnailUrl,
      imageUrl: newImage.imageUrl,
      width: newImage.width,
      height: newImage.height,
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error uploading image:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'Internal Server Error', details: 'An unknown error occurred' }, { status: 500 })
    }
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(
  request: NextRequest,
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

    // Remove the ownership check to allow viewing of other users' galleries
    // if (plant.userId !== session.user.id) {
    //   return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    // }

    const images = await prisma.plantImage.findMany({
      where: {
        plantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        thumbnailUrl: true,
        imageUrl: true,
        width: true,
        height: true,
      },
    })

    return NextResponse.json(images, { status: 200 })
  } catch (error: unknown) {
    console.error('Error fetching images:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'Internal Server Error', details: 'An unknown error occurred' }, { status: 500 })
    }
  } finally {
    await prisma.$disconnect()
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
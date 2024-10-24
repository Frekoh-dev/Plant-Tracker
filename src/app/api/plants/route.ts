import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('GET /api/plants: Fetching plants')
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      console.log('GET /api/plants: Unauthorized')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = session.user.id

    const plants = await prisma.plant.findMany({
      where: { userId: userId },
      include: {
        protocolEntries: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`GET /api/plants: Successfully fetched ${plants.length} plants`)
    return NextResponse.json(plants)
  } catch (error) {
    console.error('GET /api/plants: Error fetching plants:', error)
    return NextResponse.json({ error: 'An error occurred while fetching plants' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/plants: Creating new plant')
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      console.log('POST /api/plants: Unauthorized')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = session.user.id

    const { name, stage, imageUrl } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required and must be a string' }, { status: 400 })
    }

    if (!stage || typeof stage !== 'string') {
      return NextResponse.json({ error: 'Stage is required and must be a string' }, { status: 400 })
    }

    const newPlant = await prisma.plant.create({
      data: {
        name,
        stage,
        userId,
        imageUrl,
      },
    })

    console.log('POST /api/plants: Plant created successfully', newPlant)
    return NextResponse.json(newPlant, { status: 201 })
  } catch (error) {
    console.error('POST /api/plants: Error creating plant:', error)
    return NextResponse.json({ 
      error: 'An error occurred while creating the plant', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, PlantStage } from '@prisma/client'
import { getToken } from "next-auth/jwt"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    console.log('Received request for /api/plants')
    
    const token = await getToken({ req })
    console.log('Token from getToken:', token ? JSON.stringify(token) : 'null')
    
    if (!token || !token.sub) {
      console.log('No valid token found, returning 401')
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userId = token.sub
    console.log('User ID from token:', userId)

    const plants = await prisma.plant.findMany({
      where: { userId: userId },
      include: { protocolEntries: true },
    })

    console.log(`Found ${plants.length} plants for user ${userId}`)

    return new NextResponse(JSON.stringify(plants), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in /api/plants:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/plants: Creating new plant')
    const token = await getToken({ req })
    
    if (!token || !token.sub) {
      console.log('POST /api/plants: Unauthorized')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = token.sub

    const { name, stage, imageUrl } = await req.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required and must be a string' }, { status: 400 })
    }

    if (!stage || !Object.values(PlantStage).includes(stage as PlantStage)) {
      return NextResponse.json({ error: 'Stage is required and must be a valid PlantStage' }, { status: 400 })
    }

    const newPlant = await prisma.plant.create({
      data: {
        name,
        stage: stage as PlantStage,
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
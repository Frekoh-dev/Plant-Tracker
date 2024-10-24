// src/app/api/plants/[id]/harvest/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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
    const { harvestedAmount } = await request.json()

    const updatedPlant = await prisma.plant.update({
      where: {
        id: plantId,
        userId: session.user.id,
      },
      data: {
        isHarvested: true,
        harvestedAmount: parseFloat(harvestedAmount),
        protocolEntries: {
          create: {
            description: `Plant harvested. Amount: ${harvestedAmount}g`,
          },
        },
      },
      include: {
        protocolEntries: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    })

    return new NextResponse(
      JSON.stringify(updatedPlant),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error harvesting plant:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    )
  }
}
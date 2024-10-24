import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { id } = req.query
    const updatedPlant = await prisma.plant.update({
      where: { id: Number(id) },
      data: { harvested: true },
    })
    res.status(200).json(updatedPlant)
  } else {
    res.status(405).end()
  }
}
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const plantId = parseInt(params.id)

  try {
    const protocolEntries = await db.query(
      'SELECT * FROM protocolentry WHERE plantId = ?',
      [plantId]
    )

    return NextResponse.json(protocolEntries)
  } catch (error) {
    console.error('Error fetching protocol entries:', error)
    return NextResponse.json({ error: 'Failed to fetch protocol entries' }, { status: 500 })
  }
}
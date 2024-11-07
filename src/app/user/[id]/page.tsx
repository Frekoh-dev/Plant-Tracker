'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { PlantCard } from '@/components/PlantCard'
import { PictureGallery } from '@/components/PictureGallery'
import { Plant } from '@/types'

interface User {
  id: string
  name: string
  email: string
  imageUrl: string | undefined
  plants: Plant[]
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openPlantIds, setOpenPlantIds] = useState<number[]>([])
  const [galleryPlantId, setGalleryPlantId] = useState<number | null>(null)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === 'unauthenticated') {
        router.push('/login')
        return
      }

      if (status !== 'authenticated') return

      try {
        const response = await fetch(`/api/users/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch user profile')
        }
        const data = await response.json()
        setUser(data)
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setError('Failed to load user profile. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [params.id, router, status])

  const handleToggleUserPlant = (plantId: number) => {
    setOpenPlantIds(prevIds => prevIds.includes(plantId)
        ? prevIds.filter(id => id !== plantId)
        : [...prevIds, plantId]
    )
  }

  const handleOpenGallery = (id: number) => {
    setGalleryPlantId(id)
    setIsGalleryOpen(true)
  }

  const handleCloseGallery = () => {
    setIsGalleryOpen(false)
    setGalleryPlantId(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>
  }

  if (!user) {
    return <div className="container mx-auto p-4">User not found.</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <div className="mr-4">
          <Image
            src={user.imageUrl || '/placeholder.svg'}
            alt={`${user.name}'s profile picture`}
            width={100}
            height={100}
            className="rounded-full"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}&apos;s Profile</h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-4">Plants</h2>
      {user.plants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {user.plants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onUpdate={async () => {}}
              onWater={async () => {}}
              onUpdateStage={async () => {}}
              onDelete={async () => {}}
              onHarvest={() => {}}
              onImageUpload={async () => {}}
              onDeleteProtocolEntry={async () => {}}
              isOpen={openPlantIds.includes(plant.id)}
              onToggle={() => handleToggleUserPlant(plant.id)}
              onOpenGallery={handleOpenGallery}
              readOnly
            />
          ))}
        </div>
      ) : (
        <p>This user has no plants.</p>
      )}

      <PictureGallery
        plantId={galleryPlantId || 0}
        isOpen={isGalleryOpen}
        onClose={handleCloseGallery}
        readOnly={true}
      />
    </div>
  )
}
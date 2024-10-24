'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlantCard } from '@/components/PlantCard'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Plant, PlantStage } from '@/types'

export default function PlantTrackerPage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchPlants()
  }, [])

  const fetchPlants = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/plants', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch plants')
      }

      const data = await response.json()
      setPlants(data)
    } catch (error) {
      console.error('Error fetching plants:', error)
      toast({
        title: "Error",
        description: "Failed to fetch plants. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token')
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (response.status === 401) {
      router.push('/login')
      throw new Error('Unauthorized')
    }
    return response
  }

  const handleWater = async (plantId: number, useFertilizer: boolean) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/plants/${plantId}/water`, {
        method: 'POST',
        body: JSON.stringify({ useFertilizer }),
      })
      if (!response.ok) throw new Error('Failed to water plant')
      await fetchPlants() // Refresh plants after watering
      toast({
        title: "Success",
        description: `Plant watered${useFertilizer ? ' with fertilizer' : ''}.`,
      })
    } catch (error) {
      console.error('Error watering plant:', error)
      toast({
        title: "Error",
        description: "Failed to water plant. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStage = async (plantId: number, newStage: PlantStage) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/plants/${plantId}/stage`, {
        method: 'POST',
        body: JSON.stringify({ stage: newStage }),
      })
      if (!response.ok) throw new Error('Failed to update plant stage')
      await fetchPlants() // Refresh plants after updating stage
      toast({
        title: "Success",
        description: "Plant stage updated successfully.",
      })
    } catch (error) {
      console.error('Error updating plant stage:', error)
      toast({
        title: "Error",
        description: "Failed to update plant stage. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (plantId: number) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/plants/${plantId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete plant')
      await fetchPlants() // Refresh plants after deletion
      toast({
        title: "Success",
        description: "Plant deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting plant:', error)
      toast({
        title: "Error",
        description: "Failed to delete plant. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleHarvest = async (plantId: number, amount: number) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/plants/${plantId}/harvest`, {
        method: 'POST',
        body: JSON.stringify({ harvestedAmount: amount }),
      })
      if (!response.ok) throw new Error('Failed to harvest plant')
      await fetchPlants() // Refresh plants after harvesting
      toast({
        title: "Success",
        description: `Plant harvested successfully. Amount: ${amount}g`,
      })
    } catch (error) {
      console.error('Error harvesting plant:', error)
      toast({
        title: "Error",
        description: "Failed to harvest plant. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = async (plantId: number, file: File) => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/plants/${plantId}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })
      if (!response.ok) throw new Error('Failed to upload image')
      await fetchPlants() // Refresh plants after image upload
      toast({
        title: "Success",
        description: "Plant image uploaded successfully.",
      })
    } catch (error) {
      console.error('Error uploading plant image:', error)
      toast({
        title: "Error",
        description: "Failed to upload plant image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleOpenGallery = (plantId: number) => {
    // Implement gallery opening logic here
    console.log(`Opening gallery for plant ${plantId}`)
  }

  const handleDeleteProtocolEntry = async (plantId: number, entryId: number) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/plants/${plantId}/protocol/${entryId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete protocol entry')
      await fetchPlants() // Refresh plants after deleting protocol entry
      toast({
        title: "Success",
        description: "Protocol entry deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting protocol entry:', error)
      toast({
        title: "Error",
        description: "Failed to delete protocol entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Plants</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plants.map((plant) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            onWater={handleWater}
            onUpdateStage={handleUpdateStage}
            onDelete={handleDelete}
            onHarvest={handleHarvest}
            onImageUpload={handleImageUpload}
            onOpenGallery={handleOpenGallery}
            onDeleteProtocolEntry={handleDeleteProtocolEntry}
          />
        ))}
      </div>
      <Button
        onClick={() => {/* Implement add new plant functionality */}}
        className="mt-4"
      >
        Add New Plant
      </Button>
    </div>
  )
}
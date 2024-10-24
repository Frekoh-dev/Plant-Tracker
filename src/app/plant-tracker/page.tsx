'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { PlantCard } from '@/components/PlantCard'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plant, PlantStage } from '@/types'
import { Settings, LogOut, Loader2 } from 'lucide-react'
import { AddPlantDialog } from '@/components/AddPlantDialog'

export default function PlantTrackerPage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHarvestDialogOpen, setIsHarvestDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [harvestingPlantId, setHarvestingPlantId] = useState<number | null>(null)
  const [harvestedAmount, setHarvestedAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'harvested'>('active')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [openPlantId, setOpenPlantId] = useState<number | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchPlants()
    }
  }, [status, router])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  const fetchPlants = async () => {
    try {
      const response = await fetch('/api/plants')
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

  const handleAddPlant = (newPlant: Plant) => {
    setPlants([...plants, newPlant])
  }

  const handleWaterPlant = async (id: number, withFertilizer: boolean) => {
    try {
      const response = await fetch(`/api/plants/${id}/water`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ withFertilizer }),
      })

      if (!response.ok) {
        throw new Error('Failed to water plant')
      }

      const updatedPlant = await response.json()
      setPlants(plants.map(plant => plant.id === id ? updatedPlant : plant))
      toast({
        title: "Success",
        description: `Plant watered ${withFertilizer ? 'with fertilizer' : 'without fertilizer'}.`,
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

  const handleUpdateStage = async (id: number, stage: PlantStage) => {
    try {
      const response = await fetch(`/api/plants/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage }),
      })

      if (!response.ok) {
        throw new Error('Failed to update plant stage')
      }

      const updatedPlant = await response.json()
      setPlants(plants.map(plant => plant.id === id ? updatedPlant : plant))
      toast({
        title: "Success",
        description: "Plant stage updated successfully!",
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

  const handleDeletePlant = async (id: number) => {
    try {
      const response = await fetch(`/api/plants/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete plant')
      }

      setPlants(plants.filter(plant => plant.id !== id))
      toast({
        title: "Success",
        description: "Plant deleted successfully!",
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

  const handleHarvest = async (id: number) => {
    setHarvestingPlantId(id)
    setIsHarvestDialogOpen(true)
  }

  const handleConfirmHarvest = async () => {
    if (!harvestingPlantId) return

    try {
      const response = await fetch(`/api/plants/${harvestingPlantId}/harvest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ harvestedAmount: parseFloat(harvestedAmount) }),
      })

      if (!response.ok) {
        throw new Error('Failed to harvest plant')
      }

      const updatedPlant = await response.json()
      setPlants(plants.map(plant => plant.id === harvestingPlantId ? updatedPlant : plant))
      setIsHarvestDialogOpen(false)
      setHarvestingPlantId(null)
      setHarvestedAmount('')
      toast({
        title: "Success",
        description: "Plant harvested successfully!",
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

  const handleImageUpload = async (id: number, imageUrl: string) => {
    setPlants(plants.map(plant => plant.id === id ? { ...plant, imageUrl } : plant))
  }

  const handleOpenGallery = (id: number) => {
    // Implement gallery opening logic here
    console.log(`Opening gallery for plant ${id}`)
  }

  const handleDeleteProtocolEntry = async (plantId: number, entryId: number) => {
    try {
      const response = await fetch(`/api/plants/${plantId}/protocol/${entryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete protocol entry')
      }

      setPlants(plants.map(plant => {
        if (plant.id === plantId) {
          return {
            ...plant,
            protocolEntries: plant.protocolEntries?.filter(entry => entry.id !== entryId) || []
          }
        }
        return plant
      }))

      toast({
        title: "Success",
        description: "Protocol entry deleted successfully!",
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

  const handleTogglePlantCard = (id: number) => {
    setOpenPlantId(openPlantId === id ? null : id)
  }

  const handleUpdatePlant = async (updatedPlant: Plant) => {
    try {
      const response = await fetch(`/api/plants/${updatedPlant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPlant),
      })

      if (!response.ok) {
        throw new Error('Failed to update plant')
      }

      const updatedPlantData = await response.json()
      setPlants(plants.map(plant => plant.id === updatedPlantData.id ? updatedPlantData : plant))
      toast({
        title: "Success",
        description: "Plant updated successfully!",
      })
    } catch (error) {
      console.error('Error updating plant:', error)
      toast({
        title: "Error",
        description: "Failed to update plant. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Plants</h1>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsSettingsDialogOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'harvested')} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">Active Plants</TabsTrigger>
          <TabsTrigger value="harvested" className="flex-1">Harvested Plants</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plants.filter(plant => !plant.isHarvested).map(plant => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onUpdate={handleUpdatePlant}
                onWater={handleWaterPlant}
                onUpdateStage={handleUpdateStage}
                onDelete={handleDeletePlant}
                onHarvest={handleHarvest}
                onImageUpload={handleImageUpload}
                onOpenGallery={handleOpenGallery}
                onDeleteProtocolEntry={handleDeleteProtocolEntry}
                isOpen={openPlantId === plant.id}
                onToggle={() => handleTogglePlantCard(plant.id)}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="harvested">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plants.filter(plant => plant.isHarvested).map(plant => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onUpdate={handleUpdatePlant}
                onWater={handleWaterPlant}
                onUpdateStage={handleUpdateStage}
                onDelete={handleDeletePlant}
                onHarvest={handleHarvest}
                onImageUpload={handleImageUpload}
                onOpenGallery={handleOpenGallery}
                onDeleteProtocolEntry={handleDeleteProtocolEntry}
                isOpen={openPlantId === plant.id}
                onToggle={() => handleTogglePlantCard(plant.id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-center">
        <AddPlantDialog onAddPlant={handleAddPlant} />
      </div>

      <Dialog open={isHarvestDialogOpen} onOpenChange={setIsHarvestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Harvest Plant</DialogTitle>
          </DialogHeader>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="harvestedAmount">Harvested Amount (in grams)</Label>
              <Input
                id="harvestedAmount"
                type="number"
                value={harvestedAmount}
                onChange={(e) => setHarvestedAmount(e.target.value)}
                placeholder="Enter harvested amount"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={handleConfirmHarvest}>Confirm Harvest</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label  htmlFor="theme">Theme</Label>
              <RadioGroup id="theme" value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system">System</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsSettingsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Plus } from 'lucide-react'
import { Plant, PlantStage } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddPlantDialogProps {
  onAddPlant: (newPlant: Plant) => void
}

export function AddPlantDialog({ onAddPlant }: AddPlantDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newPlantName, setNewPlantName] = useState('')
  const [newPlantStage, setNewPlantStage] = useState<PlantStage | ''>('')
  const [newPlantImage, setNewPlantImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleAddPlant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlantName.trim()) {
      toast({
        title: "Error",
        description: "Plant name is required.",
        variant: "destructive",
      })
      return
    }

    if (!newPlantStage) {
      toast({
        title: "Error",
        description: "Plant stage is required.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/plants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPlantName,
          stage: newPlantStage,
          imageUrl: newPlantImage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to add plant')
      }

      const responseData: Plant = await response.json()
      console.log('Plant created successfully:', responseData)
      onAddPlant(responseData)
      setNewPlantName('')
      setNewPlantStage('')
      setNewPlantImage(null)
      setIsOpen(false)
      toast({
        title: "Success",
        description: "New plant added successfully!",
      })
    } catch (error) {
      console.error('Error adding plant:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add plant. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size should be less than 5MB.",
          variant: "destructive",
        })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewPlantImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-full w-12 h-12">
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Plant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddPlant}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                placeholder="Enter plant name"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="stage">Stage</Label>
              <Select value={newPlantStage} onValueChange={(value) => setNewPlantStage(value as PlantStage)}>
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEED">Seed</SelectItem>
                  <SelectItem value="SEEDLING">Seedling</SelectItem>
                  <SelectItem value="VEGETATIVE">Vegetative</SelectItem>
                  <SelectItem value="FLOWERING">Flowering</SelectItem>
                  <SelectItem value="RIPENING">Ripening</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Plant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
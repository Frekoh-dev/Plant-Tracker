'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Plant } from '@/types'
import { format, isValid, parseISO } from 'date-fns'

interface PlantDetailProps {
  plant: Plant
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedPlant: Plant) => void
}

export function PlantDetail({ plant, isOpen, onClose, onUpdate }: PlantDetailProps) {
  const [updatedPlant, setUpdatedPlant] = useState<Plant>(plant)
  const { toast } = useToast()

  useEffect(() => {
    const defaultedPlant = Object.keys(plant).reduce((acc, key) => {
      acc[key] = plant[key] ?? '';
      return acc;
    }, {} as Plant);
    setUpdatedPlant(defaultedPlant);
  }, [plant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name.endsWith('Date') || name === 'lastWatered') {
      setUpdatedPlant(prev => ({
        ...prev,
        [name]: value === '' ? null : value
      }))
    } else {
      setUpdatedPlant(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const plantToUpdate = { ...updatedPlant }
      
      // Handle date fields
      const dateFields = ['seedDate', 'seedlingDate', 'vegetativeDate', 'floweringDate', 'ripeningDate', 'lastWatered']
      dateFields.forEach(field => {
        if (plantToUpdate[field] === '') {
          plantToUpdate[field] = null
        } else if (plantToUpdate[field]) {
          plantToUpdate[field] = new Date(plantToUpdate[field]).toISOString()
        }
      })

      // Remove isHarvested and harvestedAmount from the update data
      delete plantToUpdate.isHarvested
      delete plantToUpdate.harvestedAmount

      if (typeof onUpdate === 'function') {
        await onUpdate(plantToUpdate)
        onClose()
        toast({
          title: "Success",
          description: "Plant details updated successfully!",
        })
      } else {
        console.warn('onUpdate is not a function')
        toast({
          title: "Error",
          description: "Unable to update plant details. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating plant details:', error)
      toast({
        title: "Error",
        description: "Failed to update plant details. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return ''
    const parsedDate = parseISO(date)
    return isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : ''
  }

  const formatLastWatered = (date: string | null | undefined) => {
    if (!date) return ''
    const parsedDate = parseISO(date)
    return isValid(parsedDate) ? format(parsedDate, 'dd.MM.yyyy - HH:mm:ss') : ''
  }

  const excludedFields = ['id', 'userId', 'createdAt', 'updatedAt', 'species', 'imageUrl', 'stage', 'protocolEntries', 'isHarvested', 'harvestedAmount']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plant Details: {updatedPlant.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {Object.entries(updatedPlant).map(([key, value]) => {
              if (excludedFields.includes(key)) return null

              if (key === 'lastWatered') {
                return (
                  <div key={key} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={key} className="text-right">
                      Last Watered
                    </Label>
                    <Input
                      id={key}
                      name={key}
                      type="datetime-local"
                      value={value ? format(parseISO(value as string), "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                )
              }

              if (key.endsWith('Date')) {
                return (
                  <div key={key} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={key} className="text-right">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Input
                      id={key}
                      name={key}
                      type="date"
                      value={formatDate(value as string)}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                )
              }

              return (
                <div key={key} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={key} className="text-right">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <Input
                    id={key}
                    name={key}
                    type={typeof value === 'number' ? 'number' : 'text'}
                    value={value as string | number}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
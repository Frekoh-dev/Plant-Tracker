'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Plant, PlantStage, ProtocolEntry } from '@/types'
import { format, isValid, parseISO } from 'date-fns'

interface PlantDetailProps {
  plant: Plant
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedPlant: Partial<Plant>) => Promise<void>
}

type PlantInput = {
  [K in keyof Plant]: Plant[K] | null;
};

type PlantDateFields = Extract<keyof Plant, `${string}Date` | 'lastWatered'>;
type PlantStringFields = Exclude<keyof Plant, PlantDateFields | 'stage' | 'id' | 'isHarvested' | 'harvestedAmount' | 'protocolEntries'>;
type PlantNumberFields = Extract<keyof Plant, 'id'>;

export default function PlantDetail({ plant, isOpen, onClose, onUpdate }: PlantDetailProps) {
  const [updatedPlant, setUpdatedPlant] = useState<PlantInput>({} as PlantInput)
  const { toast } = useToast()

  useEffect(() => {
    const defaultedPlant = Object.fromEntries(
      Object.entries(plant).map(([key, value]) => [key, value ?? null])
    ) as PlantInput;
    setUpdatedPlant(defaultedPlant);
  }, [plant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setUpdatedPlant(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const plantToUpdate = Object.entries(updatedPlant).reduce((acc, [key, value]) => {
        if (value !== null) {
          if ((key as PlantDateFields).endsWith('Date') || key === 'lastWatered') {
            if (typeof value === 'string') {
              acc[key as PlantDateFields] = new Date(value).toISOString();
            }
          } else if (key === 'stage') {
            acc.stage = value as PlantStage;
          } else if (key === 'protocolEntries') {
            if (Array.isArray(value)) {
              acc.protocolEntries = value as ProtocolEntry[];
            }
          } else if (key in plant) {
            if (typeof plant[key as keyof Plant] === 'number') {
              acc[key as PlantNumberFields] = Number(value);
            } else {
              acc[key as PlantStringFields] = String(value);
            }
          }
        }
        return acc;
      }, {} as Partial<Plant>);

      // Remove isHarvested and harvestedAmount from the update data
      delete plantToUpdate.isHarvested;
      delete plantToUpdate.harvestedAmount;

      await onUpdate(plantToUpdate)
      onClose()
      toast({
        title: "Success",
        description: "Plant details updated successfully!",
      })
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

  const excludedFields: (keyof Plant)[] = ['id', 'species', 'imageUrl', 'stage', 'protocolEntries', 'isHarvested', 'harvestedAmount']

  const formatValue = (value: Plant[keyof Plant] | null): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (Array.isArray(value)) return JSON.stringify(value)
    return String(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plant Details: {updatedPlant.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {(Object.keys(updatedPlant) as Array<keyof Plant>).map((key) => {
              if (excludedFields.includes(key)) return null

              const value = updatedPlant[key]

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
                      value={value ? format(new Date(value as string), "yyyy-MM-dd'T'HH:mm") : ''}
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

              if (key === 'stage') {
                return (
                  <div key={key} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={key} className="text-right">
                      Stage
                    </Label>
                    <select
                      id={key}
                      name={key}
                      value={value as PlantStage}
                      onChange={handleInputChange}
                      className="col-span-3 p-2 border rounded"
                    >
                      <option value="SEED">Seed</option>
                      <option value="SEEDLING">Seedling</option>
                      <option value="VEGETATIVE">Vegetative</option>
                      <option value="FLOWERING">Flowering</option>
                      <option value="RIPENING">Ripening</option>
                    </select>
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
                    type={typeof plant[key] === 'number' ? 'number' : 'text'}
                    value={formatValue(value)}
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
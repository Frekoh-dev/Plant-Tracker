'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Plant, PlantStage, ProtocolEntry } from '@/types'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, Droplets, Scissors, ChevronDown, Sprout, Leaf, Flower, Apple, Image as ImageIcon, FileText } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import PlantDetail from './PlantDetail'
import { format, differenceInDays } from 'date-fns'

interface PlantCardProps {
  plant: Plant
  onWater: (id: number, withFertilizer: boolean) => void
  onUpdateStage: (id: number, stage: PlantStage) => void
  onDelete: (id: number) => void
  onHarvest: (id: number) => void
  onImageUpload: (id: number, imageUrl: string) => Promise<void>
  onDeleteProtocolEntry: (plantId: number, entryId: number) => void
  onUpdate: (updatedPlant: Partial<Plant>) => void
  isOpen: boolean
  onToggle: () => void
  onOpenGallery: (id: number) => void
}

export function PlantCard({
  plant,
  onWater,
  onUpdateStage,
  onDelete,
  onHarvest,
  onImageUpload,
  onDeleteProtocolEntry,
  onUpdate,
  isOpen,
  onToggle,
  onOpenGallery
}: PlantCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false)
  const [isWaterDialogOpen, setIsWaterDialogOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [protocolEntries, setProtocolEntries] = useState<ProtocolEntry[]>([])
  const [isProtocolOpen, setIsProtocolOpen] = useState(false)
  const { toast } = useToast()
  const contentRef = useRef<HTMLDivElement>(null)
  const protocolRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    const sortedEntries = [...(plant.protocolEntries || [])].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    setProtocolEntries(sortedEntries)
  }, [plant.protocolEntries])

  useEffect(() => {
    const updateHeight = () => {
      if (contentRef.current) {
        const protocolHeight = isProtocolOpen && protocolRef.current ? protocolRef.current.scrollHeight : 0
        setContentHeight(contentRef.current.scrollHeight + protocolHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)

    return () => window.removeEventListener('resize', updateHeight)
  }, [isOpen, isProtocolOpen, protocolEntries, plant])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (contentRef.current) {
          const protocolHeight = isProtocolOpen && protocolRef.current ? protocolRef.current.scrollHeight : 0
          setContentHeight(contentRef.current.scrollHeight + protocolHeight)
        }
      }, 0)
    }
  }, [isOpen, isProtocolOpen, protocolEntries, plant])

  const handleWater = (withFertilizer: boolean) => {
    onWater(plant.id, withFertilizer)
    setIsWaterDialogOpen(false)
  }

  const handleStageChange = (newStage: PlantStage) => {
    onUpdateStage(plant.id, newStage)
  }

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx!.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Canvas to Blob conversion failed'))
          }
        }, file.type)
      }
      img.onerror = reject
    })
  }

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFile) {
      setIsUploading(true)
      try {
        const resizedImage = await resizeImage(selectedFile, 800, 800)
        const formData = new FormData()
        formData.append('image', resizedImage, selectedFile.name)

        const response = await fetch(`/api/plants/${plant.id}/image`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to upload image')
        }

        const updatedPlant = await response.json()
        await onImageUpload(plant.id, updatedPlant.imageUrl)
        setIsImageUploadDialogOpen(false)
        setSelectedFile(null)
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        })
      } catch (error) {
        console.error('Error uploading image:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDeleteProtocolEntry = async (entryId: number) => {
    try {
      await onDeleteProtocolEntry(plant.id, entryId)
      setProtocolEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId))
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

  const getStageIcon = (stage: PlantStage) => {
    switch (stage) {
      case 'SEED':
      case 'SEEDLING':
        return { icon: <Sprout className="h-4 w-4" />, color: 'border-yellow-500 text-yellow-500' }
      case 'VEGETATIVE':
        return { icon: <Leaf className="h-4 w-4" />, color: 'border-green-500 text-green-500' }
      case 'FLOWERING':
        return { icon: <Flower className="h-4 w-4" />, color: 'border-pink-500 text-pink-500' }
      case 'RIPENING':
        return { icon: <Apple className="h-4 w-4" />, color: 'border-red-500 text-red-500' }
      default:
        return { icon: <Sprout className="h-4 w-4" />, color: 'border-yellow-500 text-yellow-500' }
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const formattedDate = format(new Date(dateString), 'MMM d, yyyy')
    const daysAgo = getDaysAgo(dateString)
    return `${formattedDate} (${daysAgo})`
  }

  const formatProtocolDate = (date: string) => {
    return format(new Date(date), 'MMM d, yyyy - h:mm a')
  }

  const getDaysAgo = (dateString: string | null) => {
    if (!dateString) return null
    const days = differenceInDays(new Date(), new Date(dateString))
    return days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} ago`
  }

  const handleUpdatePlant = async (updatedPlant: Partial<Plant>) => {
    await onUpdate(updatedPlant)
    setIsDetailOpen(false)
  }

  return (
    <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <CardHeader 
        className="flex flex-row items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-2">
          {plant.imageUrl && (
            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${getStageIcon(plant.stage as PlantStage).color}`}>
              <Image src={plant.imageUrl} alt={plant.name} width={48} height={48} className="object-cover w-full h-full" />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <span className={getStageIcon(plant.stage as PlantStage).color}>
              {getStageIcon(plant.stage as PlantStage).icon}
            </span>
            <CardTitle className="text-sm">{plant.name}</CardTitle>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} />
      </CardHeader>
      <div
        ref={contentRef}
        style={{
          maxHeight: isOpen ? contentHeight : 0,
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 300ms ease-in-out, opacity 300ms ease-in-out',
        }}
      >
        <CardContent className="relative pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-32 h-32 mx-auto md:mx-0">
              <div className={`w-full h-full rounded-full overflow-hidden border-4 ${getStageIcon(plant.stage as PlantStage).color} shadow-[0_0_20px_rgba(0,0,0,5.3)] hover:shadow-[0_0_20px_rgba(0,0,0,5.3)] transition-shadow duration-300`}>
                {plant.imageUrl && (
                  <Image src={plant.imageUrl} alt={plant.name} width={128} height={128} className="object-cover w-full h-full" />
                )}
              </div>
              <Dialog open={isImageUploadDialogOpen} onOpenChange={setIsImageUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute bottom-0 right-0 z-10 bg-gray-800 hover:bg-gray-700 border-gray-700 text-white opacity-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Image</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleImageUpload}>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="picture">Picture</Label>
                      <Input id="picture" type="file" onChange={handleFileChange} />
                    </div>
                    <DialogFooter className="mt-4">
                      <Button type="submit" disabled={isUploading || !selectedFile}>
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex-grow flex flex-col justify-center">
              <div className="space-y-2">
                {plant.seedDate && (
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">Seed Date:</Label>
                    <span className="text-sm">{formatDate(plant.seedDate)}</span>
                  </div>
                )}
                {plant.seedlingDate && (
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">Seedling Date:</Label>
                    <span className="text-sm">{formatDate(plant.seedlingDate)}</span>
                  </div>
                )}
                {plant.vegetativeDate && (
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">Vegetative Date:</Label>
                    <span className="text-sm">{formatDate(plant.vegetativeDate)}</span>
                  </div>
                )}
                {plant.floweringDate && (
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">Flowering Date:</Label>
                    <span className="text-sm">{formatDate(plant.floweringDate)}</span>
                  </div>
                )}
                {plant.ripeningDate && (
                  <div className="flex justify-between items-center">
                    <Label  className="font-medium">Ripening Date:</Label>
                    <span className="text-sm">{formatDate(plant.ripeningDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-center items-center mt-4">
            <Select value={plant.stage} onValueChange={handleStageChange}>
              <SelectTrigger id={`stage-${plant.id}`} className="w-[180px]">
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
          <div>
            {plant.isHarvested && plant.harvestedAmount && (
              <p>Harvested Amount: {plant.harvestedAmount}g</p>
            )}
          </div>
          
          <div className="space-y-2 mt-4">
            {!plant.isHarvested && (
              <div className="flex space-x-2">
                <Dialog open={isWaterDialogOpen} onOpenChange={setIsWaterDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100 shadow-[0_0_10px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-shadow duration-300">
                      <Droplets className="h-4 w-4 mr-2" />
                      Water Plant
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Water Plant</DialogTitle>
                      <DialogDescription>
                        Did you water the plant with or without fertilizer?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button onClick={() => handleWater(false)}>Without Fertilizer</Button>
                      <Button onClick={() => handleWater(true)}>With Fertilizer</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="flex-1 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-100 shadow-[0_0_10px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-shadow duration-300" onClick={() => onHarvest(plant.id)}>
                  <Scissors className="h-4 w-4 mr-2" />
                  Harvest Plant
                </Button>
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-100 shadow-[0_0_10px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-shadow duration-300" 
              onClick={() => onOpenGallery(plant.id)}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Open Gallery
            </Button>
            <Button variant="outline" className="w-full bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 dark:text-yellow-100 shadow-[0_0_10px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-shadow duration-300" onClick={() => setIsDetailOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Plant Details
            </Button>
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setIsProtocolOpen(!isProtocolOpen)}
            >
              Protocol Entries
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isProtocolOpen ? 'transform rotate-180' : ''}`} />
            </Button>
            <div
              ref={protocolRef}
              style={{
                maxHeight: isProtocolOpen ? 1000 : 0,
                opacity: isProtocolOpen ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 300ms ease-in-out, opacity 300ms ease-in-out',
              }}
            >
              {protocolEntries.length > 0 ? (
                <ul className="space-y-2 mt-2">
                  {protocolEntries.map((entry) => (
                    <li key={entry.id} className="flex flex-col space-y-1">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span>{entry.description}</span>
                          <p className="text-xs text-muted-foreground">
                            {formatProtocolDate(entry.createdAt)}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteProtocolEntry(entry.id)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">No protocol entries yet.</p>
              )}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-100">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Plant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Plant</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this plant? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => { onDelete(plant.id); setIsDeleteDialogOpen(false); }}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </div>
      <PlantDetail
        plant={plant}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdate={handleUpdatePlant}
      />
    </Card>
  )
}
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
import { Pencil, Trash2, Droplets, Scissors, ChevronDown, Sprout, Leaf, Flower, Apple, Image as ImageIcon, FileText, RefreshCw } from 'lucide-react'
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
  readOnly?: boolean
}

interface UploadQueueItem {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  retry: () => void
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
  onOpenGallery,
  readOnly = false
}: PlantCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false)
  const [isWaterDialogOpen, setIsWaterDialogOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
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

  const resizeImage = async (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.onload = () => {
      let width = img.width
      let height = img.height
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }
      
      const canvas = document.createElement('canvas')
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
      }, 'image/jpeg', 0.7)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

  const uploadImage = async (file: File): Promise<string> => {
    const resizedImage = await resizeImage(file, 800, 800)
    const formData = new FormData()
    formData.append('image', resizedImage, file.name.replace(/\.[^/.]+$/, ".jpg"))

    const response = await fetch(`/api/plants/${plant.id}/image`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to upload image')
    }

    const data = await response.json()
    return data.imageUrl
  }

  const processUploadQueue = async () => {
    if (isUploading) return

    setIsUploading(true)
    const currentQueue = [...uploadQueue]

    for (let i = 0; i < currentQueue.length; i++) {
      const item = currentQueue[i]
      if (item.status === 'pending' || item.status === 'error') {
        try {
          currentQueue[i].status = 'uploading'
          setUploadQueue([...currentQueue])

          const imageUrl = await uploadImage(item.file)
          await onImageUpload(plant.id, imageUrl)

          currentQueue[i].status = 'success'
          setUploadQueue([...currentQueue])

          toast({
            title: "Success",
            description: `${item.file.name} uploaded successfully!`,
          })
        } catch (error) {
          console.error('Error uploading image:', error)
          currentQueue[i].status = 'error'
          setUploadQueue([...currentQueue])

          toast({
            title: "Error",
            description: `Failed to upload ${item.file.name}. You can retry later.`,
            variant: "destructive",
          })
        }
      }
    }

    setIsUploading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const newQueueItems: UploadQueueItem[] = newFiles.map(file => ({
        file,
        status: 'pending',
        retry: () => retryUpload(file)
      }))
      setUploadQueue(prevQueue => [...prevQueue, ...newQueueItems])
    }
  }

  const retryUpload = (file: File) => {
    setUploadQueue(prevQueue => 
      prevQueue.map(item => 
        item.file === file ? { ...item, status: 'pending' } : item
      )
    )
    processUploadQueue()
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

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return null
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    const formattedDate = format(date, 'MMM d, yyyy')
    const daysAgo = getDaysAgo(date)
    return `${formattedDate} (${daysAgo})`
  }

  const formatProtocolDate = (date: string | Date) => {
    return format(typeof date === 'string' ? new Date(date) : date, 'MMM d, yyyy - h:mm a')
  }

  const getDaysAgo = (date: Date | string) => {
    const days = differenceInDays(new Date(), new Date(date))
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
              {!readOnly && (
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
                      <DialogTitle>Upload Images</DialogTitle>
                    </DialogHeader>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="picture">Pictures</Label>
                      <Input id="picture" type="file" multiple onChange={handleFileChange} />
                    </div>
                    {uploadQueue.length > 0 && (
                      <div className="mt-4">
                        <h4 className="mb-2 font-semibold">Upload Queue</h4>
                        <ul className="space-y-2">
                          {uploadQueue.map((item, index) => (
                            <li key={index} className="flex items-center justify-between">
                              <span>{item.file.name}</span>
                              {item.status === 'error' ? (
                                <Button size="sm" onClick={() => item.retry()}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Retry
                                </Button>
                              ) : (
                                <span className="text-sm">{item.status}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <DialogFooter className="mt-4">
                      <Button onClick={() => processUploadQueue()} disabled={isUploading || uploadQueue.length === 0}>
                        {isUploading ? 'Uploading...' : 'Start Upload'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="flex-grow flex flex-col justify-center">
              <div className="space-y-2">
                {plant.lastWatered && (
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">Last Watered:</Label>
                    <span className="text-sm">{formatDate(plant.lastWatered)}</span>
                  </div>
                )}
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
                    <Label className="font-medium">Ripening Date:</Label>
                    <span className="text-sm">{formatDate(plant.ripeningDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {!readOnly && (
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
          )}
          <div>
            {plant.isHarvested && plant.harvestedAmount && (
              <p>Harvested Amount: {plant.harvestedAmount}g</p>
            )}
          </div>
          
          <div className="space-y-2 mt-4">
            {!readOnly && !plant.isHarvested && (
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
            {!readOnly && (
              <Button variant="outline" className="w-full bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 dark:text-yellow-100 shadow-[0_0_10px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-shadow duration-300" onClick={() => setIsDetailOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Plant Details
              </Button>
            )}
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
                        {!readOnly && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteProtocolEntry(entry.id)}
                            className="ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">No protocol entries yet.</p>
              )}
            </div>
          </div>
          
          {!readOnly && (
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
          )}
        </CardContent>
      </div>
      {!readOnly && (
        <PlantDetail
          plant={plant}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onUpdate={handleUpdatePlant}
        />
      )}
    </Card>
  )
}
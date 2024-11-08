'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Pencil, X, Loader2, ZoomIn, Trash2 } from 'lucide-react'
import { GalleryImage } from '@/types'
import { resizeImage } from '@/lib/imageUtils'

interface PictureGalleryProps {
  plantId: number
  isOpen: boolean
  onClose: () => void
  readOnly: boolean
}

export function PictureGallery({ plantId, isOpen, onClose, readOnly }: PictureGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loadedImages, setLoadedImages] = useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fullSizeImage, setFullSizeImage] = useState<GalleryImage | null>(null)
  const [isLoadingFullSize, setIsLoadingFullSize] = useState(false)
  const [isFullSizeDialogOpen, setIsFullSizeDialogOpen] = useState(false)
  const { toast } = useToast()

  const [isUploading, setIsUploading] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
      img.src = src
    })
  }

  const fetchImages = useCallback(async () => {
    if (!isOpen) return
    setIsLoading(true)
    setLoadedImages([])
    try {
      const response = await fetch(`/api/plants/${plantId}/images?thumbnailsOnly=true`)
      if (!response.ok) {
        throw new Error('Failed to fetch images')
      }
      const data: GalleryImage[] = await response.json()
      setImages(data)
      
      for (const image of data) {
        try {
          await preloadImage(image.thumbnailUrl)
          setLoadedImages(prev => [...prev, image])
        } catch (error) {
          console.error(`Failed to load thumbnail for image ${image.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      toast({
        title: "Error",
        description: "Failed to fetch images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [plantId, isOpen, toast])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleImageClick = async (imageId: number) => {
    setIsFullSizeDialogOpen(true)
    setIsLoadingFullSize(true)
    setFullSizeImage(null)
    try {
      const response = await fetch(`/api/plants/${plantId}/images/${imageId}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error response body: ${errorText}`)
        throw new Error(`Failed to fetch full size image: ${response.statusText}`)
      }
      
      const data: GalleryImage = await response.json()
      
      if (!data.imageUrl) {
        throw new Error('Image URL is missing from the response')
      }
      setFullSizeImage(data)
    } catch (error) {
      console.error('Error fetching full size image:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load full size image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingFullSize(false)
    }
  }

  const handleCloseFullSizeDialog = () => {
    setIsFullSizeDialogOpen(false)
    setFullSizeImage(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
    const previewUrls = files.map(file => URL.createObjectURL(file))
    setPreviewImages(previewUrls)
  }

  const clearSelectedImages = () => {
    setSelectedFiles([])
    setPreviewImages([])
  }

  const handleImageUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        
        // Resize the image
        const resizedImage = await resizeImage(file, 1920, 1080)
        
        const formData = new FormData()
        formData.append('file', resizedImage, file.name.replace(/\.[^/.]+$/, ".jpg"))

        const response = await fetch(`/api/plants/${plantId}/images`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload image: ${file.name}`)
        }

        const newImage: GalleryImage = await response.json()
        setImages(prevImages => [...prevImages, newImage])
        setLoadedImages(prevImages => [...prevImages, newImage])

        // Update progress
        setUploadProgress(((i + 1) / selectedFiles.length) * 100)
      }

      toast({
        title: "Success",
        description: `${selectedFiles.length} image(s) uploaded successfully!`,
      })
    } catch (error) {
      console.error('Error uploading images:', error)
      toast({
        title: "Error",
        description: "Failed to upload one or more images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      clearSelectedImages()
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    try {
      const response = await fetch(`/api/plants/${plantId}/images/${imageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete image')
      }

      setImages(prevImages => prevImages.filter(img => img.id !== imageId))
      setLoadedImages(prevImages => prevImages.filter(img => img.id !== imageId))
      toast({
        title: "Success",
        description: "Image deleted successfully!",
      })
    } catch (error) {
      console.error('Error deleting image:', error)
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Picture Gallery for Plant {plantId}</DialogTitle>
          <DialogDescription>
            View {readOnly ? "" : "and manage "}images for this plant. Click on an image to see it in full size.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto pr-4">
            {isLoading && loadedImages.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {loadedImages.map((image) => (
                  <div key={image.id} className="relative group aspect-square">
                    <Image
                      src={image.thumbnailUrl}
                      alt={`Plant image ${image.id}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      className="object-cover rounded-lg cursor-pointer"
                      onClick={() => handleImageClick(image.id)}
                    />
                    {!readOnly && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleImageClick(image.id)}
                    >
                      <ZoomIn className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {isLoading && loadedImages.length < images.length && (
                  <div className="flex justify-center items-center aspect-square">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>
          {!readOnly && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-col space-y-4">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors overflow-hidden">
                    {previewImages.length > 0 ? (
                      <div className="w-full h-full relative">
                        <div className="absolute inset-0 grid grid-cols-3 gap-1 p-2">
                          {previewImages.slice(0, 3).map((preview, index) => (
                            <div key={index} className="relative aspect-square">
                              <Image
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                                className="object-cover rounded-sm"
                              />
                            </div>
                          ))}
                        </div>
                        {previewImages.length > 3 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">+{previewImages.length - 3} more</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <Pencil className="mx-auto h-8 w-8 text-gray-400" />
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {isUploading ? 'Uploading...' : 'Upload new images'}
                        </span>
                      </div>
                    )}
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </Label>
                {previewImages.length > 0 && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {previewImages.length} image{previewImages.length > 1 ? 's' : ''} selected
                      </span>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={clearSelectedImages}
                          disabled={isUploading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                        <Button
                          onClick={handleImageUpload}
                          disabled={isUploading}
                        >
                          {isUploading ? 'Uploading...' : 'Confirm Upload'}
                        </Button>
                      </div>
                    </div>
                    {isUploading && (
                      <div className="w-full">
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-sm text-gray-500 mt-1 text-center">{Math.round(uploadProgress)}% uploaded</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      <Dialog open={isFullSizeDialogOpen} onOpenChange={handleCloseFullSizeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader>
            <DialogTitle className="sr-only">Full Size Image</DialogTitle>
            <DialogDescription className="sr-only">
              Enlarged view of the selected plant image.
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-full" style={{ minHeight: '60vh' }}>
            {isLoadingFullSize ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : fullSizeImage ? (
              <Image
                src={fullSizeImage.imageUrl}
                alt="Full size plant image"
                width={fullSizeImage.width || 800}
                height={fullSizeImage.height || 600}
                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p>Failed to load image</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
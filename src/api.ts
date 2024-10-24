import { Plant, PlantStage, ProtocolEntry } from "./types"
import { readAndCompressImage } from 'browser-image-resizer'

const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

export async function login(username: string, password: string): Promise<string> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Login failed')
  }

  const data = await response.json()
  return data.token
}

export async function register(username: string, password: string): Promise<void> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Registration failed')
  }
}

export async function fetchPlants(): Promise<Plant[]> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('No auth token found')
  }

  const response = await fetch('/api/plants', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch plants')
  }

  return response.json()
}

export async function addPlant(plantData: { name: string; stage: PlantStage; harvested: boolean; imageUrl?: string }): Promise<Plant> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('No auth token found')
  }

  const response = await fetch('/api/plants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(plantData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to add plant')
  }

  return response.json()
}

export async function updatePlantStage(plantId: number, stage: PlantStage): Promise<Plant> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('No auth token found')
  }

  const response = await fetch(`/api/plants/${plantId}/stage`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ stage }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to update plant stage')
  }

  return response.json()
}

export async function updatePlantProtocol(plantId: number, protocol: ProtocolEntry[]): Promise<Plant> {
  const token = getAuthToken()
  const response = await fetch(`/api/plants/${plantId}/protocol`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ protocol }),
  })

  if (!response.ok) {
    throw new Error('Failed to update plant protocol')
  }

  return response.json()
}

export async function deletePlant(plantId: number): Promise<void> {
  const token = getAuthToken()
  const response = await fetch(`/api/plants/${plantId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete plant')
  }
}

export async function waterPlant(plantId: number): Promise<Plant> {
  const token = getAuthToken()
  const response = await fetch(`/api/plants/${plantId}/water`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to water plant')
  }

  return response.json()
}

export async function harvestPlant(plantId: number): Promise<Plant> {
  const token = getAuthToken()
  const response = await fetch(`/api/plants/${plantId}/harvest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to harvest plant')
  }

  return response.json()
}


export async function deleteProtocolEntry(plantId: number, entryId: number): Promise<void> {
  const token = getAuthToken()
  const response = await fetch(`/api/plants/${plantId}/protocol/${entryId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete protocol entry')
  }
}


export async function fetchGalleryImages(plantId: number): Promise<GalleryImage[]> {
  const token = getAuthToken()
  const response = await fetch(`/api/plants/${plantId}/gallery`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch gallery images')
  }

  return response.json()
}

async function resizeImage(file: File): Promise<Blob> {
  if (typeof window === 'undefined') {
    return file
  }

  const { readAndCompressImage } = await import('browser-image-resizer')
  const config = {
    quality: 0.7,
    maxWidth: 800,
    maxHeight: 800,
    autoRotate: true,
    debug: true,
  }

  return await readAndCompressImage(file, config)
}

export async function uploadPlantImage(plantId: number, file: File): Promise<Plant> {
  const token = getAuthToken()
  if (!token) throw new Error('No auth token found')
  
  // Resize the image
  const resizedImage = await resizeImage(file)

  // Convert resized image to Base64
  const base64String = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(resizedImage)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })

  const response = await fetch(`/api/plants/${plantId}/image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ imageBase64: base64String }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to upload plant image')
  }

  return response.json()
}

export async function uploadGalleryImage(plantId: number, file: File): Promise<GalleryImage> {
  const token = getAuthToken()
  if (!token) throw new Error('No auth token found')
  
  // Resize the image
  const resizedImage = await resizeImage(file)

  // Convert resized image to Base64
  const base64String = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(resizedImage)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })

  const response = await fetch(`/api/plants/${plantId}/gallery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ imageBase64: base64String }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to upload gallery image')
  }

  return response.json()
}

import { ProtocolEntry } from '../types'

export async function fetchProtocol(plantId: number): Promise<ProtocolEntry[]> {
  try {
    const response = await fetch(`/api/plants/${plantId}/protocol`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data as ProtocolEntry[]
  } catch (error) {
    console.error('Error fetching protocol:', error)
    throw error
  }
}
import { getSession } from "next-auth/react"
import type { Session } from "next-auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

interface Plant {
  id: number;
  name: string;
  species: string;
  stage: string;
  imageUrl?: string;
  lastWatered?: string;
  lastFertilized?: string;
  harvestedAmount?: number;
  harvestedDate?: string;
}

interface ApiError extends Error {
  info?: unknown;
  status?: number;
}

type ApiResponse<T> = T extends void ? void : T;

// Extend the Session type to include accessToken
interface ExtendedSession extends Session {
  accessToken?: string;
}

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const session = await getSession() as ExtendedSession | null

  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.') as ApiError
    error.info = await response.json().catch(() => ({}))
    error.status = response.status
    throw error
  }

  if (response.status === 204) {
    return undefined as ApiResponse<T>
  }

  return response.json() as Promise<ApiResponse<T>>
}

export async function getPlants(): Promise<Plant[]> {
  return fetchWithAuth<Plant[]>('/plants')
}

export async function addPlant(plantData: Omit<Plant, 'id'>): Promise<Plant> {
  return fetchWithAuth<Plant>('/plants', {
    method: 'POST',
    body: JSON.stringify(plantData),
  })
}

export async function updatePlant(id: number, plantData: Partial<Plant>): Promise<Plant> {
  return fetchWithAuth<Plant>(`/plants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(plantData),
  })
}

export async function deletePlant(id: number): Promise<void> {
  return fetchWithAuth<void>(`/plants/${id}`, {
    method: 'DELETE',
  })
}

export async function waterPlant(id: number, withFertilizer: boolean): Promise<Plant> {
  return fetchWithAuth<Plant>(`/plants/${id}/water`, {
    method: 'POST',
    body: JSON.stringify({ withFertilizer }),
  })
}

export async function harvestPlant(id: number, harvestedAmount: number): Promise<Plant> {
  return fetchWithAuth<Plant>(`/plants/${id}/harvest`, {
    method: 'POST',
    body: JSON.stringify({ harvestedAmount }),
  })
}
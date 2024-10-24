// src/lib/api.ts

import { getToken } from './auth';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Handle unauthorized access (e.g., redirect to login page)
    removeToken();
    window.location.href = '/login';
    return null;
  }

  return response;
}

import { Protocol } from '../types'

export async function fetchProtocol(plantId: number): Promise<Protocol> {
  try {
    const response = await fetch(`/api/plants/${plantId}/protocol`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data as Protocol
  } catch (error) {
    console.error('Error fetching protocol:', error)
    throw error
  }
}
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    throw new Error(errorData.message || `HTTP ${response.status}`)
  }
  return response.json()
}

export const authApi = {
  register: async (name, email, password) => {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    })
    return handleResponse(response)
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    return handleResponse(response)
  },
}

export const workoutApi = {
  createWorkout: async (name, type, durationMins, notes) => {
    const response = await fetch(`${API_BASE}/api/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, type, durationMins, notes }),
    })
    return handleResponse(response)
  },

  getAllWorkouts: async () => {
    const response = await fetch(`${API_BASE}/api/workouts`, {
      method: 'GET',
      credentials: 'include',
    })
    return handleResponse(response)
  },

  getWorkout: async (id) => {
    const response = await fetch(`${API_BASE}/api/workouts/${id}`, {
      method: 'GET',
      credentials: 'include',
    })
    return handleResponse(response)
  },

  updateWorkout: async (id, updates) => {
    const response = await fetch(`${API_BASE}/api/workouts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    })
    return handleResponse(response)
  },

  deleteWorkout: async (id) => {
    const response = await fetch(`${API_BASE}/api/workouts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return { success: true }
  },
}

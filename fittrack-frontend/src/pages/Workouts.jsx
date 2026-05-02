import { useState, useEffect } from 'react'
import { workoutApi } from '../api/client'
import WorkoutForm from '../components/WorkoutForm'
import WorkoutList from '../components/WorkoutList'

function Workouts() {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState(null)

  const loadWorkouts = async () => {
    try {
      setError('')
      const data = await workoutApi.getAllWorkouts()
      setWorkouts(data)
    } catch (err) {
      setError(err.message || 'Failed to load workouts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkouts()
  }, [])

  const handleCreateWorkout = async (formData) => {
    try {
      await workoutApi.createWorkout(
        formData.name,
        formData.type,
        parseInt(formData.durationMins),
        formData.notes
      )
      setShowForm(false)
      loadWorkouts()
    } catch (err) {
      setError(err.message || 'Failed to create workout')
    }
  }

  const handleUpdateWorkout = async (formData) => {
    try {
      await workoutApi.updateWorkout(editingWorkout.id, {
        name: formData.name,
        type: formData.type,
        durationMins: parseInt(formData.durationMins),
        notes: formData.notes,
      })
      setEditingWorkout(null)
      loadWorkouts()
    } catch (err) {
      setError(err.message || 'Failed to update workout')
    }
  }

  const handleDeleteWorkout = async (id) => {
    try {
      await workoutApi.deleteWorkout(id)
      loadWorkouts()
    } catch (err) {
      setError(err.message || 'Failed to delete workout')
    }
  }

  const handleEditWorkout = (workout) => {
    setEditingWorkout(workout)
    setShowForm(false)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingWorkout(null)
  }

  if (loading) {
    return <div className="text-center py-8">Loading workouts...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Workouts</h1>
        {!editingWorkout && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'New Workout'}
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {showForm && <WorkoutForm onSubmit={handleCreateWorkout} onCancel={handleCancelForm} />}

      {editingWorkout && (
        <WorkoutForm
          initialWorkout={editingWorkout}
          onSubmit={handleUpdateWorkout}
          onCancel={handleCancelForm}
        />
      )}

      <WorkoutList
        workouts={workouts}
        onEdit={handleEditWorkout}
        onDelete={handleDeleteWorkout}
      />
    </div>
  )
}

export default Workouts

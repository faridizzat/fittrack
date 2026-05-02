import { useState, useEffect } from 'react'

function WorkoutForm({ onSubmit, onCancel, initialWorkout = null }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'CARDIO',
    durationMins: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialWorkout) {
      setFormData({
        name: initialWorkout.name,
        type: initialWorkout.type,
        durationMins: initialWorkout.durationMins,
        notes: initialWorkout.notes || '',
      })
    }
  }, [initialWorkout])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      if (!initialWorkout) {
        setFormData({
          name: '',
          type: 'CARDIO',
          durationMins: '',
          notes: '',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const isEditing = !!initialWorkout
  const title = isEditing ? 'Edit Workout' : 'Create New Workout'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workout Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Morning Run"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="CARDIO">Cardio</option>
            <option value="STRENGTH">Strength</option>
            <option value="FLEXIBILITY">Flexibility</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
          <input
            type="number"
            name="durationMins"
            value={formData.durationMins}
            onChange={handleChange}
            required
            min="1"
            placeholder="30"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input
            type="text"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Optional notes"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Workout' : 'Create Workout')}
        </button>
        {(isEditing || onCancel) && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:bg-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default WorkoutForm

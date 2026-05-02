import { useState } from 'react'

function WorkoutList({ workouts, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this workout?')) {
      setDeleting(id)
      try {
        await onDelete(id)
      } finally {
        setDeleting(null)
      }
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      CARDIO: 'bg-blue-100 text-blue-800',
      STRENGTH: 'bg-red-100 text-red-800',
      FLEXIBILITY: 'bg-green-100 text-green-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (workouts.length === 0) {
    return <div className="text-center py-8 text-gray-600">No workouts yet. Create one to get started!</div>
  }

  return (
    <div className="bg-white rounded shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Type</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Duration</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Created</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {workouts.map((workout) => (
            <tr key={workout.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{workout.name}</td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(workout.type)}`}>
                  {workout.type}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{workout.durationMins} min</td>
              <td className="px-6 py-4 text-sm text-gray-600">{workout.notes || '-'}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(workout.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-sm space-x-2">
                <button
                  onClick={() => onEdit(workout)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(workout.id)}
                  disabled={deleting === workout.id}
                  className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                >
                  {deleting === workout.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default WorkoutList

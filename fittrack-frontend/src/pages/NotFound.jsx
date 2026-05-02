import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
      <p className="text-xl text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">
        Go Home
      </Link>
    </div>
  )
}

export default NotFound

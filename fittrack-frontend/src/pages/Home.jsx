function Home() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to FitTrack</h1>
      <p className="text-xl text-gray-600 mb-8">
        Track your workouts, build better habits, and achieve your fitness goals.
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sign In
        </a>
        <a
          href="/register"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          Create Account
        </a>
      </div>
    </div>
  )
}

export default Home

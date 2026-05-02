# FitTrack Frontend

React + Vite + Tailwind CSS frontend for the FitTrack fitness tracker.

## Quick Start

```bash
npm install
npm run dev
```

The dev server will run on `http://localhost:5173` and proxy API calls to the backend at `http://localhost:8080`.

## Build

```bash
npm run build
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── main.jsx                 # Entry point
├── App.jsx                  # Main app with routing
├── index.css                # Tailwind styles
├── api/
│   └── client.js            # API client for backend calls
├── components/
│   ├── Layout.jsx           # Nav bar and page wrapper
│   ├── WorkoutForm.jsx      # Create workout form
│   └── WorkoutList.jsx      # Workouts table
└── pages/
    ├── Home.jsx             # Landing page
    ├── Login.jsx            # Login form
    ├── Register.jsx         # Register form
    ├── Workouts.jsx         # Workouts list + CRUD
    └── NotFound.jsx         # 404 page
```

## Features

- **Auth Pages**: Register, login with JWT stored in HttpOnly cookies
- **Workout CRUD**: Create, read, update, delete workouts (owned by authenticated user)
- **API Integration**: All calls include credentials for cookie-based auth
- **Tailwind Styling**: Clean, responsive UI with Tailwind CSS

## Environment

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:8080
```

If not provided, defaults to `http://localhost:8080`.

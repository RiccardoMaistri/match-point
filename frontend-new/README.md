# Match Point Frontend

This is the new JavaScript frontend for the Match Point tournament management system, converted from the HTML designs created with Google Stitch.

## Features

- **Authentication**: Login/Register with JWT tokens
- **Tournament Management**: View, create, and manage tournaments
- **Responsive Design**: Mobile-first design using Tailwind CSS
- **SPA Routing**: Client-side routing for smooth navigation
- **API Integration**: Full integration with FastAPI backend

## Pages

1. **Home** (`/`) - Dashboard with quick access to tournaments and profile
2. **Login** (`/login`) - User authentication
3. **Register** (`/register`) - User registration
4. **Tournaments** (`/tournaments`) - List of all tournaments
5. **Tournament Detail** (`/tournament/:id`) - Detailed view of a specific tournament
6. **Profile** (`/profile`) - User profile information
7. **Settings** (`/settings`) - Application settings

## Architecture

- **`index.html`** - Main HTML file with app container
- **`js/api.js`** - API service for backend communication
- **`js/auth.js`** - Authentication service
- **`js/components.js`** - Reusable UI components
- **`js/router.js`** - Client-side routing
- **`js/app.js`** - Main application logic
- **`backend/main.py`** - Simple HTTP server for development

## Running the Frontend

### Option 1: Use the startup script (recommended)
```bash
# From the match-point directory
./start.sh
```

### Option 2: Run manually
```bash
# Start backend (from backend directory)
python -m uvicorn main:app --reload --port 8001

# Start frontend (from frontend-new directory)
python server.py
```

The frontend will be available at http://localhost:8080
The backend API will be available at http://localhost:8001

## Design

The frontend maintains the exact visual design from the original HTML files:
- Dark theme with `#141a1f` background
- Plus Jakarta Sans font family
- Consistent component styling
- Mobile-optimized layout
- Bottom navigation bar
- Tailwind CSS for styling
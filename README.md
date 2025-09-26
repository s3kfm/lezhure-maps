# Los Angeles Events Map

A Google Maps demo application showcasing events scattered across Los Angeles venues. Built with Next.js, TypeScript, and Google Maps API.

## Features

- **Interactive Google Maps**: Displays events across Los Angeles with custom markers
- **Event Data**: 30 events at real LA venues (Walt Disney Concert Hall, Hollywood Bowl, Dodger Stadium, etc.)
- **Custom Markers**: White dots with gray centers (no clustering)
- **Event Details**: Click markers to view event information including:
  - Event title and description
  - Venue location
  - Date and time
  - Event categories/filters
  - Seeded images (consistent per event)
- **Date Distribution**: Events centered around September 25, 2025
  - 20 events within the first week (Sept 26 - Oct 2)
  - 10 events spread throughout October

## Tech Stack

- **Next.js 15.5.4** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Maps API** - Map functionality
- **@googlemaps/react-wrapper** - React integration for Google Maps

## Getting Started

### Prerequisites

- Node.js 18+ 
- Google Maps API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lezhure-maps
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Add your Google Maps API key to `.env.local`:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### Getting a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Maps JavaScript API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### Running the Application

```bash
npm run dev
```

Open [http://localhost:3000/map](http://localhost:3000/map) to view the map.

## Project Structure

```
src/
├── app/
│   ├── map/
│   │   └── page.tsx          # Map page component
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   └── map.tsx               # Google Maps component with markers
├── data/
│   └── events.json           # Event data (30 LA venues)
└── types/
    └── event.ts              # TypeScript event interface
```

## Event Data Structure

Each event includes:
- Unique ID
- Coordinates (latitude/longitude)
- Venue name
- Event title and description
- Start time
- Host information
- Event categories/filters
- Seeded images for consistency

## Venues Included

The map features events at iconic LA locations including:
- Walt Disney Concert Hall
- Hollywood Bowl
- Dodger Stadium
- Crypto.com Arena
- Greek Theatre
- Santa Monica Pier
- Universal Studios Hollywood
- TCL Chinese Theatre
- Griffith Observatory
- Venice Beach
- Beverly Hills Hotel
- And many more!

## Customization

### Adding More Events

Edit `src/data/events.json` to add more events. Follow the existing structure:

```json
{
  "id": "evt_xxx",
  "images": [{"is_primary": true, "url": "https://picsum.photos/seed/evtxxx/400/300"}],
  "latitude": 34.0522,
  "longitude": -118.2437,
  "location_name": "Venue Name",
  "start_time": "2025-09-26T19:30:00Z",
  "title": "Event Title",
  "description": "Event description",
  "distance_km": 0,
  "host": { /* host details */ },
  "filters": [{"id": "category", "name": "Category"}]
}
```

### Customizing Markers

Modify the marker icon in `src/components/map.tsx`:

```typescript
const markerIcon = {
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: '#ffffff',      // Change fill color
  fillOpacity: 1,
  strokeColor: '#666666',    // Change border color
  strokeWeight: 2,           // Change border width
  scale: 8,                  // Change size
};
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## License

This project is for demonstration purposes.

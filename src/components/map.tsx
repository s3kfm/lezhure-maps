'use client';

import { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Event } from '@/types/event';
import eventsData from '@/data/events.json';

// Custom marker component
const CustomMarker = ({ 
  position, 
  map, 
  event 
}: { 
  position: google.maps.LatLngLiteral; 
  map: google.maps.Map | null;
  event: Event;
}) => {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);

  useEffect(() => {
    if (!map) return;

    // Define EventImageOverlay class inside the component where google is available
    class EventImageOverlay extends google.maps.OverlayView {
      private position: google.maps.LatLng;
      private imageUrl: string;
      private title: string;
      public div: HTMLDivElement | null = null;

      constructor(position: google.maps.LatLng, imageUrl: string, title: string) {
        super();
        this.position = position;
        this.imageUrl = imageUrl;
        this.title = title;
      }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.cursor = 'pointer';
        this.div.style.zIndex = '1000';
        this.div.style.display = 'flex';
        this.div.style.flexDirection = 'column';
        this.div.style.alignItems = 'center';
        
        const img = document.createElement('img');
        img.src = this.imageUrl;
        img.alt = this.title;
        img.style.width = '60px';
        img.style.height = '40px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '6px';
        img.style.border = '2px solid white';
        img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        img.style.transition = 'transform 0.2s ease';
        
        // Add hover effect
        img.addEventListener('mouseenter', () => {
          img.style.transform = 'scale(1.1)';
        });
        
        img.addEventListener('mouseleave', () => {
          img.style.transform = 'scale(1)';
        });
        
        // Create title text element
        const titleElement = document.createElement('div');
        titleElement.textContent = this.title;
        titleElement.style.marginTop = '4px';
        titleElement.style.fontSize = '11px';
        titleElement.style.fontWeight = 'bold';
        titleElement.style.color = '#333';
        titleElement.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        titleElement.style.padding = '2px 6px';
        titleElement.style.borderRadius = '4px';
        titleElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        titleElement.style.textAlign = 'center';
        titleElement.style.maxWidth = '80px';
        titleElement.style.whiteSpace = 'nowrap';
        titleElement.style.overflow = 'hidden';
        titleElement.style.textOverflow = 'ellipsis';
        
        this.div.appendChild(img);
        this.div.appendChild(titleElement);
        
        const panes = this.getPanes();
        if (panes) {
          panes.overlayMouseTarget.appendChild(this.div);
        }
      }

      draw() {
        if (!this.div) return;
        
        const overlayProjection = this.getProjection();
        const position = overlayProjection.fromLatLngToDivPixel(this.position);
        
        if (position) {
          this.div.style.left = (position.x - 40) + 'px'; // Center horizontally (80px max width / 2)
          this.div.style.top = (position.y - 80) + 'px'; // Position above marker (40px image + 20px title + 20px offset)
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    // Create custom marker icon (white dot with gray center)
    const markerIcon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
          <defs>
            <radialGradient id="grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#b45454ff"/>
              <stop offset="100%" stop-color="#ccccccff"/>
            </radialGradient>
          </defs>
          <!-- Outer ring -->
          <circle cx="10" cy="10" r="8" fill="url(#grad)" stroke="#8a3a3aff" stroke-width="1.5"/>
          <!-- Inner circle -->
          <circle cx="10" cy="10" r="4" fill="#f3f3f3"/>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(20, 20),
      anchor: new google.maps.Point(10, 10),
    };

    // Create marker
    const marker = new google.maps.Marker({
      position,
      map,
      icon: markerIcon,
      title: event.title,
    });

    // Create image overlay above the marker
    const imageOverlay = new EventImageOverlay(
      new google.maps.LatLng(position.lat, position.lng),
      event.images[0]?.url || '',
      event.title
    );
    imageOverlay.setMap(map);

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="max-width: 300px; padding: 10px;">
          <img src="${event.images[0]?.url}" alt="${event.title}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" />
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${event.title}</h3>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${event.location_name}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;">${event.description}</p>
          <p style="margin: 0; color: #888; font-size: 12px;">
            ${new Date(event.start_time).toLocaleDateString()} at ${new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div style="margin-top: 8px;">
            ${event.filters.map(filter => `<span style="background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">${filter.name}</span>`).join('')}
          </div>
        </div>
      `,
    });

    // Add click listeners to both marker and image overlay
    const openInfoWindow = () => {
      infoWindow.open(map, marker);
    };

    marker.addListener('click', openInfoWindow);
    
    // Add click listener to the image overlay
    if (imageOverlay.div) {
      imageOverlay.div.addEventListener('click', openInfoWindow);
    }

    markerRef.current = marker;
    overlayRef.current = imageOverlay;

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }
    };
  }, [map, position, event]);

  return null;
};

// Map component
const MapComponent = ({ center, zoom }: { center: google.maps.LatLngLiteral; zoom: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new google.maps.Map(ref.current, {
        center,
        zoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });
      setMap(newMap);
    }
  }, [ref, map, center, zoom]);

  return (
    <>
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
      {map && eventsData.map((event) => (
        <CustomMarker
          key={event.id}
          position={{ lat: event.latitude, lng: event.longitude }}
          map={map}
          event={event as Event}
        />
      ))}
    </>
  );
};

// Main Map wrapper component
const Map = () => {
  const render = (status: Status) => {
    if (status === Status.LOADING) return <div className="flex items-center justify-center h-full">Loading map...</div>;
    if (status === Status.FAILURE) return <div className="flex items-center justify-center h-full text-red-500">Error loading map</div>;
    return <div />;
  };

  // Center on Los Angeles
  const center = { lat: 34.0522, lng: -118.2437 };
  const zoom = 11;

  return (
    <div className="w-full h-full">
      <Wrapper 
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
        render={render}
      >
        <MapComponent center={center} zoom={zoom} />
      </Wrapper>
    </div>
  );
};

export default Map;

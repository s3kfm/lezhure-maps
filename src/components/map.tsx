'use client';

import { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Event } from '@/types/event';
import eventsData from '@/data/events.json';

// Custom marker component
const CustomMarker = ({
  position,
  map,
  event,
  showOverlay,
}: {
  position: google.maps.LatLngLiteral;
  map: google.maps.Map | null;
  event: Event;
  showOverlay: boolean;
}) => {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);

  useEffect(() => {
    if (!map) return;

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
        this.div.style.opacity = '0';
        this.div.style.transform = 'scale(0.8)';
        this.div.style.transition = 'opacity 0.25s ease, transform 0.25s ease';

        const img = document.createElement('img');
        img.src = this.imageUrl;
        img.alt = this.title;
        img.style.width = '24px';
        img.style.height = '24px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '4px'; // square with slight rounding
        img.style.border = '1px solid white';
        img.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
        img.style.transition = 'transform 0.18s ease';
        img.addEventListener('mouseenter', () => (img.style.transform = 'scale(1.1)'));
        img.addEventListener('mouseleave', () => (img.style.transform = 'scale(1)'));

        const titleElement = document.createElement('div');
        titleElement.textContent = this.title;
        titleElement.style.marginTop = '3px';
        titleElement.style.fontSize = '10px';
        titleElement.style.fontWeight = '600';
        titleElement.style.color = '#000';
        titleElement.style.textShadow = '0 1px 2px rgba(255,255,255,0.9)';
        titleElement.style.textAlign = 'center';
        titleElement.style.maxWidth = '80px';
        titleElement.style.whiteSpace = 'nowrap';
        titleElement.style.overflow = 'hidden';
        titleElement.style.textOverflow = 'ellipsis';

        this.div.appendChild(img);
        this.div.appendChild(titleElement);

        const panes = this.getPanes();
        if (panes) panes.overlayMouseTarget.appendChild(this.div);

        // animate in
        requestAnimationFrame(() => {
          if (this.div) {
            this.div.style.opacity = '1';
            this.div.style.transform = 'scale(1)';
          }
        });
      }

      draw() {
        if (!this.div) return;
        const overlayProjection = this.getProjection();
        const p = overlayProjection.fromLatLngToDivPixel(this.position);
        if (p) {
          const overlayWidth = 24;
          const overlayHeight = 24 + 14; // image + text height
          const markerRadius = 8; // for 16px dot

          this.div.style.left = `${p.x - overlayWidth / 2}px`;
          this.div.style.top = `${p.y - overlayHeight - markerRadius - 4}px`;
        }
      }

      onRemove() {
        if (this.div) {
          this.div.style.opacity = '0';
          this.div.style.transform = 'scale(0.8)';
          setTimeout(() => {
            if (this.div && this.div.parentNode) {
              this.div.parentNode.removeChild(this.div);
              this.div = null;
            }
          }, 250);
        }
      }
    }

    const markerIcon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
          <defs>
            <radialGradient id="g" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stop-color="#FFFFFF"/>
              <stop offset="85%" stop-color="#FFFFFF"/>
              <stop offset="100%" stop-color="#F1F1F1"/>
            </radialGradient>
          </defs>
          <circle cx="8" cy="8" r="6.5" fill="url(#g)" stroke="#D0D0D0" stroke-width="1"/>
          <circle cx="8" cy="8" r="3" fill="#9C9C9C"/>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(16, 16),
      anchor: new google.maps.Point(8, 8),
    };

    const marker = new google.maps.Marker({
      position,
      map,
      icon: markerIcon,
      title: event.title,
      optimized: true,
      zIndex: 2,
    });

    let imageOverlay: EventImageOverlay | null = null;
    if (showOverlay) {
      imageOverlay = new EventImageOverlay(
        new google.maps.LatLng(position.lat, position.lng),
        event.images[0]?.url || '',
        event.title
      );
      imageOverlay.setMap(map);
    }

    markerRef.current = marker;
    overlayRef.current = imageOverlay;

    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
      if (overlayRef.current) overlayRef.current.setMap(null);
    };
  }, [map, position, event, showOverlay]);

  return null;
};

const MapComponent = ({ center, zoom }: { center: google.maps.LatLngLiteral; zoom: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [visibleOverlays, setVisibleOverlays] = useState<{ [id: string]: Event }>({});

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new google.maps.Map(ref.current, {
        center,
        zoom,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
        gestureHandling: 'greedy',
      });
      setMap(newMap);
    }
  }, [ref, map, center, zoom]);

  useEffect(() => {
    if (!map) return;

    const updateOverlays = () => {
      const projection = map.getProjection();
      if (!projection) return;

      const clusters: Event[][] = [];
      const clusterDistance = 50; // px distance threshold

      eventsData.forEach((event) => {
        const point = projection.fromLatLngToPoint(
          new google.maps.LatLng(event.latitude, event.longitude)
        );
        if (!point) return;

        let added = false;
        for (const cluster of clusters) {
          const ref = cluster[0];
          const refPoint = projection.fromLatLngToPoint(
            new google.maps.LatLng(ref.latitude, ref.longitude)
          );
          if (!refPoint) continue;

          const dx = (point.x - refPoint.x) * (1 << map.getZoom());
          const dy = (point.y - refPoint.y) * (1 << map.getZoom());
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < clusterDistance) {
            cluster.push(event);
            added = true;
            break;
          }
        }
        if (!added) clusters.push([event]);
      });

      // Pick the earliest event in each cluster
      const newVisible: { [id: string]: Event } = {};
      clusters.forEach((cluster) => {
        const chosen = cluster.reduce((a, b) =>
          new Date(a.startDate) < new Date(b.startDate) ? a : b
        );
        newVisible[chosen.id] = chosen;
      });

      setVisibleOverlays(newVisible);
    };

    google.maps.event.addListener(map, 'idle', updateOverlays);
    updateOverlays();

    return () => {
      google.maps.event.clearListeners(map, 'idle');
    };
  }, [map]);

  return (
    <>
      <div ref={ref} style={{ width: '100%', height: '100%' }} />
      {map &&
        eventsData.map((event) => (
          <CustomMarker
            key={event.id}
            position={{ lat: event.latitude, lng: event.longitude }}
            map={map}
            event={event as Event}
            showOverlay={!!visibleOverlays[event.id]}
          />
        ))}
    </>
  );
};

const Map = () => {
  const render = (status: Status) => {
    if (status === Status.LOADING) return <div className="flex items-center justify-center h-full">Loading map...</div>;
    if (status === Status.FAILURE) return <div className="flex items-center justify-center h-full text-red-500">Error loading map</div>;
    return <div />;
  };

  const center = { lat: 34.0522, lng: -118.2437 };
  const zoom = 11;

  return (
    <div className="w-full h-full">
      <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} render={render}>
        <MapComponent center={center} zoom={zoom} />
      </Wrapper>
    </div>
  );
};

export default Map;

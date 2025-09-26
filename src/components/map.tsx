'use client';

import { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Event } from '@/types/event';
import eventsData from '@/data/events.json';

const CustomMarker = ({
  position,
  map,
  event,
  showImage,
}: {
  position: google.maps.LatLngLiteral;
  map: google.maps.Map | null;
  event: Event;
  showImage: boolean;
}) => {
  const overlayRef = useRef<google.maps.OverlayView | null>(null);

  useEffect(() => {
    if (!map) return;

    class TightMarker extends google.maps.OverlayView {
      private position: google.maps.LatLng;
      private event: Event;
      private showImage: boolean;
      public div: HTMLDivElement | null = null;

      constructor(position: google.maps.LatLng, event: Event, showImage: boolean) {
        super();
        this.position = position;
        this.event = event;
        this.showImage = showImage;
      }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.display = 'flex';
        this.div.style.flexDirection = 'column';
        this.div.style.alignItems = 'center';
        this.div.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        this.div.style.opacity = '0';
        this.div.style.transform = 'scale(0.8)';

        if (this.showImage) {
          const img = document.createElement('img');
          img.src = this.event.images[0]?.url || '';
          img.alt = this.event.title;
          img.style.width = '24px';
          img.style.height = '24px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '4px';
          img.style.border = '1px solid white';
          img.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
          this.div.appendChild(img);

          const title = document.createElement('div');
          title.textContent = this.event.title;
          title.style.fontSize = '10px';
          title.style.fontWeight = '600';
          title.style.color = '#000';
          // Crisp white outline effect
          title.style.textShadow =
            '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff';
          title.style.marginTop = '2px';
          title.style.maxWidth = '80px';
          title.style.whiteSpace = 'nowrap';
          title.style.overflow = 'hidden';
          title.style.textOverflow = 'ellipsis';
          this.div.appendChild(title);
        }

        // Dot always at the bottom
        const dot = document.createElement('div');
        dot.style.width = '16px';
        dot.style.height = '16px';
        dot.style.borderRadius = '50%';
        dot.style.background = 'radial-gradient(circle at 50% 45%, #fff 0%, #f1f1f1 100%)';
        dot.style.border = '1px solid #d0d0d0';
        dot.style.boxShadow = '0 1px 2px rgba(0,0,0,0.25)';
        dot.style.marginTop = '2px';
        this.div.appendChild(dot);

        const panes = this.getPanes();
        if (panes) panes.overlayMouseTarget.appendChild(this.div);

        requestAnimationFrame(() => {
          if (this.div) {
            this.div.style.opacity = '1';
            this.div.style.transform = 'scale(1)';
          }
        });
      }

      draw() {
        if (!this.div) return;
        const projection = this.getProjection();
        const point = projection.fromLatLngToDivPixel(this.position);
        if (point) {
          const totalHeight = this.showImage ? 24 + 14 + 16 + 6 : 16;
          this.div.style.left = `${point.x - 12}px`;
          this.div.style.top = `${point.y - totalHeight / 2}px`;
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

    const overlay = new TightMarker(
      new google.maps.LatLng(position.lat, position.lng),
      event,
      showImage
    );
    overlay.setMap(map);

    overlayRef.current = overlay;

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, position, event, showImage]);

  return null;
};

const MapComponent = ({ center, zoom }: { center: google.maps.LatLngLiteral; zoom: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [visibleImages, setVisibleImages] = useState<{ [id: string]: Event }>({});

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

    const update = () => {
      const projection = map.getProjection();
      if (!projection) return;

      const clusters: Event[][] = [];
      const clusterDistance = 50;

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

          const dx = (point.x - refPoint.x) * (1 << (map!.getZoom() ?? 0));
          const dy = (point.y - refPoint.y) * (1 << (map!.getZoom() ?? 0));
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < clusterDistance) {
            cluster.push(event);
            added = true;
            break;
          }
        }
        if (!added) clusters.push([event]);
      });

      const newVisible: { [id: string]: Event } = {};
      clusters.forEach((cluster) => {
        const chosen = cluster.reduce((a, b) =>
          new Date(a.start_time) < new Date(b.start_time) ? a : b
        );
        newVisible[chosen.id] = chosen;
      });

      setVisibleImages(newVisible);
    };

    google.maps.event.addListener(map, 'idle', update);
    update();

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
            showImage={!!visibleImages[event.id]}
          />
        ))}
    </>
  );
};

const Map = () => {
  const render = (status: Status) => {
    if (status === Status.LOADING)
      return <div className="flex items-center justify-center h-full">Loading map...</div>;
    if (status === Status.FAILURE)
      return <div className="flex items-center justify-center h-full text-red-500">Error loading map</div>;
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

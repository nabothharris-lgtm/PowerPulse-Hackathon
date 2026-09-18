import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface MapMarkerItem {
  id: string;
  type?: 'INCIDENT' | 'REPORT' | string;
  title: string;
  categoryName?: string;
  priority?: string;
  status?: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  description?: string;
  color?: string;
  radiusMeters?: number;
  affectedRadiusMeters?: number;
  engineerName?: string;
  relatedReportsCount?: number;
}

interface InteractiveMapProps {
  markers?: MapMarkerItem[];
  center?: L.LatLngTuple;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  interactivePicker?: boolean;
  selectedCoordinates?: [number, number] | null;
  onCoordinatesChange?: (coords: [number, number]) => void;
  onMarkerClick?: (marker: any) => void;
  heightClass?: string;
  height?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers = [],
  center,
  centerLat,
  centerLng,
  zoom = 13,
  interactivePicker = false,
  selectedCoordinates = null,
  onCoordinatesChange,
  onMarkerClick,
  heightClass = 'h-96',
  height,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  const resolvedCenter: L.LatLngTuple = 
    centerLat !== undefined && centerLng !== undefined
      ? [centerLat, centerLng]
      : center || [-1.2508, 29.9892];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: resolvedCenter,
      zoom,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors | PowerPulse Uganda Grid GIS',
    }).addTo(map);

    const markerGroup = L.layerGroup().addTo(map);
    markerGroupRef.current = markerGroup;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    // Watch container size changes (e.g. orientation changes on phones, tab switching, responsive drawers)
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Interactive Picker Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !interactivePicker) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (onCoordinatesChange) {
        onCoordinatesChange([lat, lng]);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [interactivePicker, onCoordinatesChange]);

  // Update Picker Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !interactivePicker) return;

    if (selectedCoordinates) {
      const [lat, lng] = selectedCoordinates;
      if (!pickerMarkerRef.current) {
        const pickerIcon = L.divIcon({
          className: 'custom-picker-pin',
          html: `
            <div class="relative flex items-center justify-center">
              <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-red-400 opacity-75"></span>
              <div class="relative bg-red-600 text-white p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center w-8 h-8">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([lat, lng], {
          icon: pickerIcon,
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          if (onCoordinatesChange) {
            onCoordinatesChange([pos.lat, pos.lng]);
          }
        });

        pickerMarkerRef.current = marker;
      } else {
        pickerMarkerRef.current.setLatLng([lat, lng]);
      }
      map.panTo([lat, lng]);
    }
  }, [selectedCoordinates, interactivePicker, onCoordinatesChange]);

  // Render Display Markers (Incidents / Reports)
  useEffect(() => {
    const markerGroup = markerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!markerGroup || !map || interactivePicker) return;

    markerGroup.clearLayers();
    if (markers.length === 0) return;

    markers.forEach(item => {
      const priority = item.priority || 'NORMAL';
      const status = item.status || 'OPEN';
      const isEmergency = priority === 'EMERGENCY';
      const isCritical = priority === 'CRITICAL';
      const isReopened = status === 'REOPENED';
      const isClosed = status === 'CLOSED';

      let pinColor = item.color || '#3b82f6';
      if (!item.color) {
        if (isClosed) pinColor = '#10b981';
        else if (isReopened) pinColor = '#dc2626';
        else if (isEmergency) pinColor = '#ef4444';
        else if (isCritical) pinColor = '#f97316';
      }

      const markerHtml = `
        <div class="relative cursor-pointer transition-transform hover:scale-110">
          ${(isEmergency || isReopened) ? '<span class="animate-ping absolute -top-1 -left-1 h-7 w-7 rounded-full bg-red-400 opacity-75"></span>' : ''}
          <div style="background-color: ${pinColor};" class="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold">
            ${item.type === 'INCIDENT' ? '⚡' : '📍'}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-icon',
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([item.latitude, item.longitude], { icon: customIcon });

      const safeStatusLabel = (typeof status === 'string' ? status : '').replace(/_/g, ' ') || 'OPEN';
      const popupContent = `
        <div class="p-2 font-sans min-w-[200px]">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isEmergency ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}">
              ${priority}
            </span>
            <span class="text-[10px] font-medium text-slate-500">${safeStatusLabel}</span>
          </div>
          <h4 class="font-bold text-sm text-slate-900 leading-tight mb-1">${item.title || 'Location Pin'}</h4>
          ${item.locationName ? `<p class="text-xs text-slate-600 mb-2">${item.locationName}</p>` : ''}
          ${item.description ? `<p class="text-xs text-slate-500 mb-2">${item.description}</p>` : ''}
          ${item.engineerName ? `<p class="text-[11px] text-blue-700 font-medium">Crew: ${item.engineerName}</p>` : ''}
          ${item.relatedReportsCount ? `<p class="text-[11px] text-slate-500">${item.relatedReportsCount} linked resident reports</p>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onMarkerClick) {
          try {
            onMarkerClick(item.id);
          } catch {
            onMarkerClick(item);
          }
        }
      });

      markerGroup.addLayer(marker);

      const radius = item.affectedRadiusMeters || item.radiusMeters;
      if (radius && !isClosed) {
        const circle = L.circle([item.latitude, item.longitude], {
          radius,
          color: pinColor,
          fillColor: pinColor,
          fillOpacity: 0.1,
          weight: 1.5,
          dashArray: '4, 4',
        });
        markerGroup.addLayer(circle);
      }
    });
  }, [markers, interactivePicker, onMarkerClick]);

  return (
    <div 
      className={`relative w-full ${height ? '' : heightClass} rounded-xl overflow-hidden border border-slate-200 shadow-xs`}
      style={height ? { height } : undefined}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {interactivePicker && (
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          Click anywhere or drag pin to set incident location
        </div>
      )}
    </div>
  );
};

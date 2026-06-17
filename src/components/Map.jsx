import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MARKER_TYPES } from '../utils/constants';
import { getTripMateIds } from '../utils/markerTrips';
import { useUserLocation } from '../hooks/useUserLocation';
import { calculateDistanceKm, formatDistance } from '../utils/geo';
import { normalizeLng } from '../utils/mapWrap';

// 放大时保持原始标点大小；仅在缩小到较大尺度（世界/区域视图）时适度缩小
function getMarkerDimensions(zoom, isSelected) {
  const fullSizeZoom = 8;
  const minZoom = 3;
  const minScale = 0.55;

  const size = isSelected ? 44 : 36;
  const fontSize = isSelected ? 18 : 15;
  const borderWidth = isSelected ? 4 : 3;
  const ringWidth = 3;

  if (zoom >= fullSizeZoom) {
    return { size, fontSize, borderWidth, ringWidth };
  }

  const t = Math.max(0, Math.min(1, (zoom - minZoom) / (fullSizeZoom - minZoom)));
  const scale = minScale + t * (1 - minScale);

  return {
    size: Math.round(size * scale),
    fontSize: Math.round(fontSize * scale),
    borderWidth: Math.max(1, Math.round(borderWidth * scale)),
    ringWidth: Math.max(1, Math.round(ringWidth * scale)),
  };
}

function createDivIcon(marker, isSelected, isTripMate, zoom, animateIn) {
  const typeInfo = MARKER_TYPES[marker.type] || MARKER_TYPES.spot;
  const color = marker.color || typeInfo.color;
  const icon = marker.icon || typeInfo.icon;
  const { size, fontSize, borderWidth } = getMarkerDimensions(zoom, isSelected || isTripMate);

  const classes = [
    'marker-pin-inner',
    isSelected ? 'marker-pin-inner--selected' : '',
    isTripMate && !isSelected ? 'marker-pin-inner--trip-mate' : '',
    animateIn && !isSelected ? 'marker-pin-inner--fade-in' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const html = `
    <div
      class="${classes}"
      style="width:${size}px;height:${size}px;background:${color};border-width:${borderWidth}px"
    >
      <span class="marker-pin-icon" style="font-size:${fontSize}px">${icon}</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function MapRefSetter({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    if (mapRef) mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

function MapClickHandler({ isMapInteractive, onMapClick }) {
  useMapEvents({
    click(e) {
      if (isMapInteractive) {
        onMapClick({ lat: e.latlng.lat, lng: normalizeLng(e.latlng.lng) });
      }
    },
  });
  return null;
}

function MapWorldScroll({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(null);
    if (mapRef) mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

function MarkersLayer({ markers, allMarkers, selectedMarker, selectedMarkerId, onMarkerSelect }) {
  const map = useMap();
  const { location } = useUserLocation();
  const [zoom, setZoom] = useState(() => map.getZoom());
  const prevMarkerIdsKeyRef = useRef('');
  const markerIdsKey = useMemo(() => markers.map((m) => m.id).join(','), [markers]);
  const tripMateIds = useMemo(
    () => getTripMateIds(allMarkers || markers, selectedMarker),
    [allMarkers, markers, selectedMarker]
  );

  useEffect(() => {
    const animateFilterChange = prevMarkerIdsKeyRef.current !== markerIdsKey;
    prevMarkerIdsKeyRef.current = markerIdsKey;

    const markerInstances = [];

    markers.forEach((m) => {
      const isSelected = m.id === selectedMarkerId;
      const isTripMate = tripMateIds.has(m.id);
      const icon = createDivIcon(m, isSelected, isTripMate, zoom, animateFilterChange);
      const leafletMarker = L.marker([m.latitude, m.longitude], {
        icon,
        zIndexOffset: isSelected ? 1000 : isTripMate ? 200 : 0,
      });

      const typeInfo = MARKER_TYPES[m.type] || MARKER_TYPES.spot;
      const distance = location
        ? formatDistance(calculateDistanceKm(location.lat, location.lng, m.latitude, m.longitude))
        : null;

      const popupContent = `
        <div style="min-width:160px;font-family:system-ui,sans-serif">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${m.name}</div>
          <div style="font-size:12px;color:#666;margin-bottom:4px">
            <span style="background:${m.color};color:white;padding:1px 6px;border-radius:10px;font-size:11px">
              ${typeInfo.label}
            </span>
            ${m.date ? `<span style="margin-left:6px">${m.date}${m.endDate ? ` — ${m.endDate}` : ''}</span>` : ''}
            ${distance ? `<span style="margin-left:6px">距离您${distance}km</span>` : ''}
          </div>
          <div style="font-size:12px;color:#444">${m.title}</div>
        </div>
      `;
      leafletMarker.bindPopup(popupContent, { maxWidth: 220 });
      leafletMarker.on('click', () => {
        onMarkerSelect(m.id);
      });

      leafletMarker.addTo(map);
      markerInstances.push(leafletMarker);
    });

    return () => {
      markerInstances.forEach((lm) => lm.remove());
    };
  }, [markers, allMarkers, selectedMarker, selectedMarkerId, onMarkerSelect, map, location, zoom, tripMateIds, markerIdsKey]);

  useEffect(() => {
    const updateZoom = () => setZoom(map.getZoom());
    map.on('zoom', updateZoom);
    map.on('zoomend', updateZoom);
    return () => {
      map.off('zoom', updateZoom);
      map.off('zoomend', updateZoom);
    };
  }, [map]);

  return null;
}

function ZoomControl({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    if (mapRef) mapRef.current = map;
  }, [map, mapRef]);

  const handleZoom = (direction) => {
    if (direction === 'in') {
      map.zoomIn();
    } else {
      map.zoomOut();
    }
  };

  return (
    <div className="map-zoom-control absolute z-[400] flex flex-col gap-1 bg-memorial-surface rounded-lg shadow-memorial border border-memorial-border overflow-hidden">
      <button
        onClick={() => handleZoom('in')}
        className="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center hover:bg-memorial-cream active:bg-memorial-cream-dark transition-colors text-lg font-bold text-memorial-muted"
        title="放大"
        aria-label="放大"
      >
        +
      </button>
      <div className="w-full h-px bg-memorial-border" />
      <button
        onClick={() => handleZoom('out')}
        className="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center hover:bg-memorial-cream active:bg-memorial-cream-dark transition-colors text-lg font-bold text-memorial-muted"
        title="缩小"
        aria-label="缩小"
      >
        −
      </button>
    </div>
  );
}

export default function MapView({
  mapRef,
  markers,
  allMarkers,
  selectedMarker,
  selectedMarkerId,
  onMarkerSelect,
  onMapClick,
  isMapInteractive,
}) {
  // worldCopyJump：Leaflet 横向循环拖动的关键；无 maxBounds 经度限制
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={3}
      worldCopyJump
      style={{ width: '100%', height: '100%' }}
      className={isMapInteractive ? 'cursor-crosshair' : ''}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        noWrap={false}
      />
      <MapWorldScroll mapRef={mapRef} />
      <MapRefSetter mapRef={mapRef} />
      <MapClickHandler isMapInteractive={isMapInteractive} onMapClick={onMapClick} />
      <MarkersLayer
        markers={markers}
        allMarkers={allMarkers}
        selectedMarker={selectedMarker}
        selectedMarkerId={selectedMarkerId}
        onMarkerSelect={onMarkerSelect}
      />
      <ZoomControl mapRef={mapRef} />
    </MapContainer>
  );
}

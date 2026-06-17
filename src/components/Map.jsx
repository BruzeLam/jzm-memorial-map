import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MARKER_TYPES } from '../utils/constants';
import { getTripMateIds } from '../utils/markerTrips';
import { useUserLocation } from '../hooks/useUserLocation';
import { calculateDistanceKm, formatDistance } from '../utils/geo';
import { normalizeLng } from '../utils/mapWrap';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPopupHtml(marker, typeInfo, distance, isSelected) {
  const accent = marker.color || typeInfo.color;
  const title = marker.title ? `<p class="memorial-popup-desc">${escapeHtml(marker.title)}</p>` : '';
  const dateLine = marker.date
    ? `<span class="memorial-popup-date">${escapeHtml(marker.date)}${marker.endDate ? ` — ${escapeHtml(marker.endDate)}` : ''}</span>`
    : '';
  const distanceLine = distance
    ? `<span class="memorial-popup-distance">距您 ${escapeHtml(distance)} km</span>`
    : '';

  return `
    <div class="memorial-popup ${isSelected ? 'memorial-popup--selected' : ''}" style="--popup-accent:${accent}">
      <div class="memorial-popup-header">
        <span class="memorial-popup-badge" style="background:${accent}">${typeInfo.icon}</span>
        <div class="memorial-popup-meta">
          <div class="memorial-popup-name">${escapeHtml(marker.name)}</div>
          <div class="memorial-popup-tags">
            <span class="memorial-popup-type" style="background:${accent}">${escapeHtml(typeInfo.label)}</span>
            ${dateLine}
            ${distanceLine}
          </div>
        </div>
      </div>
      ${title}
    </div>
  `;
}

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
      style="width:${size}px;height:${size}px;background:${color};border-width:${borderWidth}px;${isSelected ? `--marker-accent:${color};` : ''}"
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
  const markerInstancesRef = useRef(new Map());
  const markerIdsKey = useMemo(() => markers.map((m) => m.id).join(','), [markers]);
  const tripMateIds = useMemo(
    () => getTripMateIds(allMarkers || markers, selectedMarker),
    [allMarkers, markers, selectedMarker]
  );

  useEffect(() => {
    const animateFilterChange = prevMarkerIdsKeyRef.current !== markerIdsKey;
    prevMarkerIdsKeyRef.current = markerIdsKey;

    const markerInstances = [];
    markerInstancesRef.current.clear();

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

      const popupContent = buildPopupHtml(m, typeInfo, distance, isSelected);
      leafletMarker.bindPopup(popupContent, {
        maxWidth: 260,
        className: `memorial-map-popup${isSelected ? ' memorial-map-popup--selected' : ''}`,
      });
      leafletMarker.on('click', () => {
        onMarkerSelect(m.id);
      });

      leafletMarker.addTo(map);
      markerInstances.push(leafletMarker);
      markerInstancesRef.current.set(m.id, leafletMarker);
    });

    return () => {
      markerInstances.forEach((lm) => lm.remove());
      markerInstancesRef.current.clear();
    };
  }, [markers, allMarkers, selectedMarker, selectedMarkerId, onMarkerSelect, map, location, zoom, tripMateIds, markerIdsKey]);

  useEffect(() => {
    markerInstancesRef.current.forEach((leafletMarker, id) => {
      if (id === selectedMarkerId) {
        leafletMarker.openPopup();
      } else {
        leafletMarker.closePopup();
      }
    });
  }, [selectedMarkerId, markerIdsKey]);

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
    <div className="map-zoom-control memorial-card absolute z-[400] flex flex-col overflow-hidden p-0">
      <button
        type="button"
        onClick={() => handleZoom('in')}
        className="map-zoom-btn w-11 h-11 md:w-10 md:h-10 flex items-center justify-center text-lg font-bold text-memorial-navy"
        title="放大"
        aria-label="放大"
      >
        +
      </button>
      <div className="w-full h-px bg-memorial-border" />
      <button
        type="button"
        onClick={() => handleZoom('out')}
        className="map-zoom-btn w-11 h-11 md:w-10 md:h-10 flex items-center justify-center text-lg font-bold text-memorial-navy"
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

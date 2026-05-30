import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MARKER_TYPES } from '../utils/constants';
import { getTripMateIds } from '../utils/markerTrips';

// 计算两点间距离（Haversine公式）单位：km
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半径（km）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

// 地理定位hook
function useUserLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('浏览器不支持地理定位');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        setError(err.message);
      }
    );
  }, []);

  return { location, error };
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

function createDivIcon(marker, isSelected, isTripMate, zoom) {
  const typeInfo = MARKER_TYPES[marker.type] || MARKER_TYPES.spot;
  const color = marker.color || typeInfo.color;
  const icon = marker.icon || typeInfo.icon;
  const { size, fontSize, borderWidth, ringWidth } = getMarkerDimensions(zoom, isSelected || isTripMate);

  const tripRing = isTripMate && !isSelected
    ? `0 0 0 ${ringWidth}px rgba(30,136,229,0.65)`
    : null;
  const shadow = isSelected
    ? `0 0 0 ${ringWidth}px ${color}, 0 4px 12px rgba(0,0,0,0.5)`
    : tripRing
      ? `${tripRing}, 0 2px 8px rgba(0,0,0,0.4)`
      : '0 2px 8px rgba(0,0,0,0.4)';

  const html = `
    <div style="
      width:${size}px;
      height:${size}px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:${borderWidth}px solid rgba(255,255,255,0.9);
      box-shadow:${shadow};
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
    ">
      <span style="transform:rotate(45deg);font-size:${fontSize}px;line-height:1;">${icon}</span>
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
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

function MarkersLayer({ markers, allMarkers, selectedMarker, selectedMarkerId, onMarkerSelect }) {
  const map = useMap();
  const { location } = useUserLocation();
  const [zoom, setZoom] = useState(() => map.getZoom());
  const tripMateIds = useMemo(
    () => getTripMateIds(allMarkers || markers, selectedMarker),
    [allMarkers, markers, selectedMarker]
  );

  useEffect(() => {
    const updateZoom = () => setZoom(map.getZoom());
    map.on('zoom', updateZoom);
    map.on('zoomend', updateZoom);
    return () => {
      map.off('zoom', updateZoom);
      map.off('zoomend', updateZoom);
    };
  }, [map]);

  useEffect(() => {
    const markerInstances = [];

    markers.forEach((m) => {
      const isSelected = m.id === selectedMarkerId;
      const isTripMate = tripMateIds.has(m.id);
      const icon = createDivIcon(m, isSelected, isTripMate, zoom);
      const leafletMarker = L.marker([m.latitude, m.longitude], { icon });

      const typeInfo = MARKER_TYPES[m.type] || MARKER_TYPES.spot;
      const distance = location ? calculateDistance(location.lat, location.lng, m.latitude, m.longitude) : null;

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
  }, [markers, allMarkers, selectedMarker, selectedMarkerId, onMarkerSelect, map, location, zoom, tripMateIds]);

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
    <div className="absolute top-4 right-4 z-[400] flex flex-col gap-1 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <button
        onClick={() => handleZoom('in')}
        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors text-lg font-bold text-gray-600 hover:text-gray-800"
        title="放大"
      >
        +
      </button>
      <div className="w-full h-px bg-gray-200" />
      <button
        onClick={() => handleZoom('out')}
        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors text-lg font-bold text-gray-600 hover:text-gray-800"
        title="缩小"
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
  // 限制地图拖动范围在全球范围内
  const globalBounds = [[-85, -180], [85, 180]];

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={3}
      maxBounds={globalBounds}
      maxBoundsViscosity={1.0}
      style={{ width: '100%', height: '100%' }}
      className={isMapInteractive ? 'cursor-crosshair' : ''}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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

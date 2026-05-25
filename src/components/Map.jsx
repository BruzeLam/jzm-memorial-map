import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MARKER_TYPES } from '../utils/constants';

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

// 为 trip 分配颜色（预设调色板）
const TRIP_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A8D8EA',
];

function getTripColor(tripId) {
  if (!tripId) return null;
  const hash = tripId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TRIP_COLORS[hash % TRIP_COLORS.length];
}

// 根据缩放级别计算标点尺寸：世界视图更小，城市级视图正常大小
function getMarkerDimensions(zoom, isSelected) {
  const baseZoom = 10;
  const minZoom = 3;
  const minScale = 0.38;
  const selectedBoost = isSelected ? 1.2 : 1;

  let scale = 1;
  if (zoom < baseZoom) {
    const t = Math.max(0, Math.min(1, (zoom - minZoom) / (baseZoom - minZoom)));
    scale = minScale + t * (1 - minScale);
  } else if (zoom > baseZoom) {
    scale = Math.min(1.12, 1 + (zoom - baseZoom) * 0.015);
  }

  const baseSize = 36 * selectedBoost;
  const size = Math.max(12, Math.round(baseSize * scale));
  const fontSize = Math.max(8, Math.round((isSelected ? 18 : 15) * scale));
  const borderWidth = Math.max(1, Math.round((isSelected ? 4 : 3) * scale));
  const ringWidth = Math.max(1, Math.round(3 * scale));

  return { size, fontSize, borderWidth, ringWidth };
}

function createDivIcon(marker, isSelected, zoom) {
  const typeInfo = MARKER_TYPES[marker.type] || MARKER_TYPES.spot;
  const color = marker.color || typeInfo.color;
  const icon = marker.icon || typeInfo.icon;
  const { size, fontSize, borderWidth, ringWidth } = getMarkerDimensions(zoom, isSelected);
  const tripColor = getTripColor(marker.tripId);

  const html = `
    <div style="
      width:${size}px;
      height:${size}px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:${tripColor ? `${borderWidth}px solid ${tripColor}` : `${borderWidth}px solid rgba(255,255,255,0.9)`};
      box-shadow:${isSelected ? `0 0 0 ${ringWidth}px ${color}, 0 4px 12px rgba(0,0,0,0.5)` : `0 2px 8px rgba(0,0,0,0.4)${tripColor ? `, inset 0 0 0 1px ${tripColor}` : ''}`};
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

function MapClickHandler({ isAddingMode, onMapClick }) {
  useMapEvents({
    click(e) {
      if (isAddingMode) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

function MarkersLayer({ markers, selectedMarkerId, onMarkerSelect }) {
  const map = useMap();
  const { location } = useUserLocation();
  const [zoom, setZoom] = useState(() => map.getZoom());

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
      const icon = createDivIcon(m, isSelected, zoom);
      const leafletMarker = L.marker([m.latitude, m.longitude], { icon });

      const typeInfo = MARKER_TYPES[m.type] || MARKER_TYPES.spot;
      const distance = location ? calculateDistance(location.lat, location.lng, m.latitude, m.longitude) : null;

      const tripColor = getTripColor(m.tripId);
      const popupContent = `
        <div style="min-width:160px;font-family:system-ui,sans-serif">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${m.name}</div>
          <div style="font-size:12px;color:#666;margin-bottom:4px">
            <span style="background:${m.color};color:white;padding:1px 6px;border-radius:10px;font-size:11px">
              ${typeInfo.label}
            </span>
            ${m.date ? `<span style="margin-left:6px">${m.date}</span>` : ''}
            ${distance ? `<span style="margin-left:6px">距离您${distance}km</span>` : ''}
          </div>
          ${m.tripName ? `<div style="font-size:11px;color:#999;margin-bottom:4px;padding:4px;background:#f5f5f5;border-left:3px solid ${tripColor};border-radius:2px">📍 ${m.tripName}</div>` : ''}
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
  }, [markers, selectedMarkerId, onMarkerSelect, map, location, zoom]);

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

export default function MapView({ mapRef, markers, selectedMarkerId, onMarkerSelect, onMapClick, isAddingMode }) {
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
      className={isAddingMode ? 'cursor-crosshair' : ''}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapRefSetter mapRef={mapRef} />
      <MapClickHandler isAddingMode={isAddingMode} onMapClick={onMapClick} />
      <MarkersLayer
        markers={markers}
        selectedMarkerId={selectedMarkerId}
        onMarkerSelect={onMarkerSelect}
      />
      <ZoomControl mapRef={mapRef} />
    </MapContainer>
  );
}

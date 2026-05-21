import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MARKER_TYPES } from '../utils/constants';

function createDivIcon(marker, isSelected) {
  const typeInfo = MARKER_TYPES[marker.type] || MARKER_TYPES.spot;
  const color = marker.color || typeInfo.color;
  const icon = marker.icon || typeInfo.icon;
  const size = isSelected ? 44 : 36;
  const html = `
    <div style="
      width:${size}px;
      height:${size}px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid rgba(255,255,255,0.9);
      box-shadow:${isSelected ? `0 0 0 3px ${color}, 0 4px 12px rgba(0,0,0,0.5)` : '0 2px 8px rgba(0,0,0,0.4)'};
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
    ">
      <span style="transform:rotate(45deg);font-size:${isSelected ? 18 : 15}px;line-height:1;">${icon}</span>
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

  useEffect(() => {
    const markerInstances = [];

    markers.forEach((m) => {
      const isSelected = m.id === selectedMarkerId;
      const icon = createDivIcon(m, isSelected);
      const leafletMarker = L.marker([m.latitude, m.longitude], { icon });

      const typeInfo = MARKER_TYPES[m.type] || MARKER_TYPES.spot;
      const popupContent = `
        <div style="min-width:160px;font-family:system-ui,sans-serif">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${m.name}</div>
          <div style="font-size:12px;color:#666;margin-bottom:4px">
            <span style="background:${m.color};color:white;padding:1px 6px;border-radius:10px;font-size:11px">
              ${typeInfo.label}
            </span>
            ${m.date ? `<span style="margin-left:6px">${m.date}</span>` : ''}
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
  }, [markers, selectedMarkerId, onMarkerSelect, map]);

  return null;
}

export default function MapView({ mapRef, markers, selectedMarkerId, onMarkerSelect, onMapClick, isAddingMode }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ width: '100%', height: '100%' }}
      className={isAddingMode ? 'cursor-crosshair' : ''}
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
    </MapContainer>
  );
}

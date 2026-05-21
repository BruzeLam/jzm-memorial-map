import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MARKER_TYPES } from '../utils/constants';

// 根据zoom level判断是否聚合
function shouldAggregate(zoom) {
  return zoom < 8;
}

// 获取聚合的admin key
function getAggregateKey(marker, zoom) {
  if (zoom >= 8) return null; // 不聚合

  // zoom < 6: 全球聚合（中国作为一个，其他各国各自一个）
  if (zoom < 6) {
    return marker.country === '中国' ? 'China' : `Country:${marker.country}`;
  }

  // 6 <= zoom < 8: 国内按省，国外按国
  if (marker.country === '中国') {
    return `Province:${marker.province}`;
  } else {
    return `Country:${marker.country}`;
  }
}

// 计算聚合标记的位置（使用聚合内所有标记的中心）
function calculateClusterCenter(clusterMarkers) {
  const avg = (arr) => arr.reduce((a, b) => a + b) / arr.length;
  return {
    lat: avg(clusterMarkers.map((m) => m.latitude)),
    lng: avg(clusterMarkers.map((m) => m.longitude)),
  };
}

// 生成聚合标记icon
function createClusterIcon(clusterMarkers, isSelected) {
  const total = clusterMarkers.length;

  const size = isSelected ? 50 : 44;
  const html = `
    <div style="
      width:${size}px;
      height:${size}px;
      background:#dc2626;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid rgba(255,255,255,0.9);
      box-shadow:${isSelected ? '0 0 0 3px #dc2626, 0 4px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.4)'};
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      font-weight:bold;
      color:white;
    ">
      <span style="transform:rotate(45deg);font-size:${isSelected ? 18 : 16}px;line-height:1;">${total}</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'cluster-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

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
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    const handleZoom = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [map]);

  useEffect(() => {
    const markerInstances = [];
    const isAggregating = shouldAggregate(zoom);

    if (isAggregating) {
      // Group markers by aggregate key
      const clusters = {};
      markers.forEach((m) => {
        const key = getAggregateKey(m, zoom);
        if (!clusters[key]) {
          clusters[key] = [];
        }
        clusters[key].push(m);
      });

      // Render cluster markers
      Object.entries(clusters).forEach(([key, clusterMarkers]) => {
        if (clusterMarkers.length === 1) {
          // Single marker in cluster, render as normal
          const m = clusterMarkers[0];
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
        } else {
          // Multiple markers in cluster, render as cluster
          const center = calculateClusterCenter(clusterMarkers);
          const isSelected = false;
          const icon = createClusterIcon(clusterMarkers, isSelected);
          const leafletMarker = L.marker([center.lat, center.lng], { icon });

          const spot = clusterMarkers.filter((m) => m.type === 'spot').length;
          const event = clusterMarkers.filter((m) => m.type === 'event').length;
          const transition = clusterMarkers.filter((m) => m.type === 'transition').length;

          const popupContent = `
            <div style="min-width:160px;font-family:system-ui,sans-serif">
              <div style="font-weight:700;font-size:14px;margin-bottom:6px">${key.replace(/^(Province|Country):/, '')}</div>
              <div style="font-size:12px;color:#666;space-y:2px">
                ${spot > 0 ? `<div>📍 足迹: ${spot}</div>` : ''}
                ${event > 0 ? `<div>⭐ 历史事件: ${event}</div>` : ''}
                ${transition > 0 ? `<div>📊 调任: ${transition}</div>` : ''}
              </div>
            </div>
          `;
          leafletMarker.bindPopup(popupContent, { maxWidth: 220 });

          leafletMarker.addTo(map);
          markerInstances.push(leafletMarker);
        }
      });
    } else {
      // No aggregation, render all markers normally
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
    }

    return () => {
      markerInstances.forEach((lm) => lm.remove());
    };
  }, [markers, selectedMarkerId, onMarkerSelect, map, zoom]);

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

/**
 * Export markers as JSON string
 */
export function exportAsJSON(markers) {
  const data = {
    title: '江泽民同志生平纪念地图',
    exportedAt: new Date().toISOString(),
    total: markers.length,
    markers,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Export markers as CSV string
 */
export function exportAsCSV(markers) {
  const headers = [
    'id',
    'type',
    'name',
    'latitude',
    'longitude',
    'date',
    'title',
    'description',
    'color',
    'icon',
    'sources',
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = markers.map((m) => {
    const sourcesStr = (m.sources || [])
      .map((s) => s.title + (s.note ? `(${s.note})` : ''))
      .join('; ');
    return [
      m.id,
      m.type,
      m.name,
      m.latitude,
      m.longitude,
      m.date,
      m.title,
      m.description,
      m.color,
      m.icon,
      sourcesStr,
    ]
      .map(escapeCSV)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export markers as GeoJSON FeatureCollection
 */
export function exportAsGeoJSON(markers) {
  const features = markers.map((m) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [m.longitude, m.latitude],
    },
    properties: {
      id: m.id,
      type: m.type,
      name: m.name,
      date: m.date,
      title: m.title,
      description: m.description,
      color: m.color,
      icon: m.icon,
      images: m.images || [],
      sources: m.sources || [],
    },
  }));

  const geojson = {
    type: 'FeatureCollection',
    name: '江泽民同志生平纪念地图',
    exportedAt: new Date().toISOString(),
    features,
  };

  return JSON.stringify(geojson, null, 2);
}

/**
 * Trigger a browser download of a string as a file
 */
export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export and download markers in the specified format
 */
export function exportMarkers(markers, format) {
  const timestamp = new Date().toISOString().slice(0, 10);
  switch (format) {
    case 'json': {
      const content = exportAsJSON(markers);
      downloadFile(content, `jzm-memorial-${timestamp}.json`, 'application/json');
      break;
    }
    case 'csv': {
      const content = exportAsCSV(markers);
      downloadFile(content, `jzm-memorial-${timestamp}.csv`, 'text/csv;charset=utf-8;');
      break;
    }
    case 'geojson': {
      const content = exportAsGeoJSON(markers);
      downloadFile(content, `jzm-memorial-${timestamp}.geojson`, 'application/geo+json');
      break;
    }
    default:
      console.warn('Unknown export format:', format);
  }
}

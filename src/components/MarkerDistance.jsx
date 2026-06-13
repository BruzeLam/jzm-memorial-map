import React from 'react';
import { useUserLocation } from '../hooks/useUserLocation';
import { calculateDistanceKm, formatDistance } from '../utils/geo';
import { useI18n } from '../i18n/LanguageContext';

export default function MarkerDistance({ latitude, longitude, className = '' }) {
  const { t } = useI18n();
  const { location, error } = useUserLocation();

  if (error || !location || latitude == null || longitude == null) {
    return null;
  }

  const km = calculateDistanceKm(location.lat, location.lng, latitude, longitude);
  const distance = formatDistance(km);

  return (
    <span className={`text-blue-600 font-medium whitespace-nowrap tabular-nums ${className}`}>
      {t('marker.distanceFromYou', { distance })}
    </span>
  );
}

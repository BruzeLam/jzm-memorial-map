import { useMemo } from 'react';
import { MARKER_TYPES } from '../utils/constants';
import { getTripSiblings, resolveTripSummary, resolveLocalDescription } from '../utils/markerTrips';

export function useMarkerDetailFields(marker, markers = []) {
  return useMemo(() => {
    if (!marker) {
      return {
        typeInfo: MARKER_TYPES.spot,
        localDesc: '',
        tripSummary: '',
        siblings: [],
      };
    }
    return {
      typeInfo: MARKER_TYPES[marker.type] || MARKER_TYPES.spot,
      localDesc: resolveLocalDescription(marker),
      tripSummary: resolveTripSummary(marker, markers),
      siblings: getTripSiblings(markers, marker),
    };
  }, [marker, markers]);
}

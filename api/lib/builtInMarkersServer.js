/** 服务端专用：静态合并内置标点，避免 serverless 上 dynamic import 卡住 */

import { isPortfolioDemoData } from '../../src/config/branding.js';
import { PORTFOLIO_SAMPLE_MARKERS } from '../../src/data/portfolio/markers.js';
import { CORE_SAMPLE_MARKERS } from '../../src/utils/constants.js';
import { ITINERARY_MARKERS_1990_1996 } from '../../src/data/itineraryMarkers.js';
import { ITINERARY_MARKERS_1997_2000 } from '../../src/data/itineraryMarkers1997_2000.js';
import { ITINERARY_MARKERS_2001_2002 } from '../../src/data/itineraryMarkers2001_2002.js';
import { MULTILATERAL_EVENT_MARKERS } from '../../src/data/multilateralEvents.js';

let fullCache = null;

export function getFullBuiltInMarkersSync() {
  if (fullCache) return fullCache;
  if (isPortfolioDemoData()) {
    fullCache = PORTFOLIO_SAMPLE_MARKERS;
    return fullCache;
  }
  fullCache = [
    ...CORE_SAMPLE_MARKERS,
    ...ITINERARY_MARKERS_1990_1996,
    ...ITINERARY_MARKERS_1997_2000,
    ...ITINERARY_MARKERS_2001_2002,
    ...MULTILATERAL_EVENT_MARKERS,
  ];
  return fullCache;
}

export function getCoreBuiltInMarkersSync() {
  return isPortfolioDemoData() ? PORTFOLIO_SAMPLE_MARKERS : CORE_SAMPLE_MARKERS;
}

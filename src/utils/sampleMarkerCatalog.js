import { isPortfolioDemoData } from '../config/branding';
import { PORTFOLIO_SAMPLE_MARKERS } from '../data/portfolio/markers';
import { CORE_SAMPLE_MARKERS } from './constants';

let extendedCache = null;
let extendedPromise = null;

/** 动态加载 1990–2002 外事行程与多边会议标点（独立 chunk，首屏不阻塞） */
export async function loadExtendedBuiltInMarkers() {
  if (isPortfolioDemoData()) return [];
  if (extendedCache) return extendedCache;
  if (extendedPromise) return extendedPromise;

  extendedPromise = Promise.all([
    import('../data/itineraryMarkers'),
    import('../data/itineraryMarkers1997_2000'),
    import('../data/itineraryMarkers2001_2002'),
    import('../data/multilateralEvents'),
  ])
    .then(([m1990, m1997, m2001, multilateral]) => {
      extendedCache = [
        ...m1990.ITINERARY_MARKERS_1990_1996,
        ...m1997.ITINERARY_MARKERS_1997_2000,
        ...m2001.ITINERARY_MARKERS_2001_2002,
        ...multilateral.MULTILATERAL_EVENT_MARKERS,
      ];
      return extendedCache;
    })
    .catch((err) => {
      extendedPromise = null;
      throw err;
    });

  return extendedPromise;
}

export function getCoreBuiltInMarkers() {
  return isPortfolioDemoData() ? PORTFOLIO_SAMPLE_MARKERS : CORE_SAMPLE_MARKERS;
}

/** 核心 + 行程扩展的完整内置 catalog（Admin / Agent 等需全量时使用） */
export async function getFullBuiltInMarkers() {
  if (isPortfolioDemoData()) return PORTFOLIO_SAMPLE_MARKERS;
  const extended = await loadExtendedBuiltInMarkers();
  return [...getCoreBuiltInMarkers(), ...extended];
}

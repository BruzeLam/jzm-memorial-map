const isPortfolio = process.env.REACT_APP_PORTFOLIO_MODE === 'true';

/** 作品集模式：使用内置演示数据，不连生产 Supabase（仍可单独配置演示库） */
export function isPortfolioMode() {
  return isPortfolio;
}

export function isPortfolioDemoData() {
  if (!isPortfolio) return false;
  return process.env.REACT_APP_PORTFOLIO_DEMO_DATA !== 'false';
}

export function getStorageKeys() {
  if (isPortfolio) {
    return {
      markers: 'elder_memorial_markers',
      markersVersion: 'elder_memorial_data_version',
      markersCache: 'elder_memorial_markers_cache',
      gallery: 'elder_gallery_images',
      galleryCache: 'elder_gallery_cache',
      galleryVersion: 'elder_gallery_version',
      quotes: 'elder_all_quotes',
      quotesMigrated: 'elder_quotes_migrated_v2',
      quotesCache: 'elder_all_quotes_cache',
      archives: 'elder_all_archives',
      archivesMigrated: 'elder_archives_migrated_v1',
      archivesTagsSeed: 'elder_archives_tags_seeded_v2',
      archivesCache: 'elder_all_archives_cache',
      locale: 'elder_locale',
      markerTags: 'elder_marker_tag_registry',
      archiveTags: 'elder_archive_tag_registry',
    };
  }
  return {
    markers: 'jzm_memorial_markers',
    markersVersion: 'jzm_memorial_data_version',
    markersCache: 'jzm_memorial_markers_cache',
    gallery: 'jzm_gallery_images',
    galleryCache: 'jzm_gallery_cache',
    galleryVersion: 'jzm_gallery_version',
    quotes: 'jzm_all_quotes',
    quotesMigrated: 'jzm_quotes_migrated_v2',
    quotesCache: 'jzm_all_quotes_cache',
    archives: 'jzm_all_archives',
    archivesMigrated: 'jzm_archives_migrated_v1',
    archivesTagsSeed: 'jzm_archives_tags_seeded_v2',
    archivesCache: 'jzm_all_archives_cache',
    locale: 'jzm_locale',
    markerTags: 'jzm_marker_tag_registry',
    archiveTags: 'jzm_archive_tag_registry',
  };
}

export function getBranding() {
  if (isPortfolio) {
    return {
      siteTitle: '伟人足迹互动地图',
      siteSubtitle: '交互式历史地理信息可视化',
      siteDescription: '伟人足迹互动地图 — 足迹、历史事件与文献地点的可视化探索（作品集演示）',
      headerLink: null,
      adminTitle: 'ElderMap 管理后台',
      adminSubtitle: '云端数据管理 · 作品集演示',
      exportProjectName: '伟人足迹互动地图',
      exportFilePrefix: 'elder-legacy',
      quotesPanelSubtitle: 'Classical Quotes Library',
      archivePanelSubtitle: 'Historical Archives',
      countdownLabel: '距里程碑',
      milestoneDate: '2030-01-01',
      milestoneDisplay: '2030.1.1',
    };
  }
  return {
    siteTitle: '江泽民同志生平纪念地图',
    siteSubtitle: '交互式历史足迹地图',
    siteDescription: '江泽民同志生平纪念地图 - 记录足迹、历史事件和题字地点',
    headerLink: 'https://www.news.cn/politics/2022-12/02/c_1129179786.htm',
    adminTitle: '江迹 · 管理后台',
    adminSubtitle: '使用邮箱魔法链接登录，仅授权邮箱可写入云端数据。',
    exportProjectName: '江泽民同志生平纪念地图',
    exportFilePrefix: 'jzm-memorial',
    quotesPanelSubtitle: 'The Yangtze Quotes Library',
    archivePanelSubtitle: 'Historical Archives',
    countdownLabel: '距百岁诞辰',
    milestoneDate: '2026-08-17',
    milestoneDisplay: '1926.8.17',
  };
}

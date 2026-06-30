/**
 * 品牌与 Storage Key 模板
 * 复制到 src/config/branding.js 并按实例修改
 */

export function getStorageKeys() {
  const prefix = 'myhero'; // ← 改成你的项目前缀
  return {
    markers: `${prefix}_memorial_markers`,
    markersVersion: `${prefix}_memorial_data_version`,
    markersCache: `${prefix}_memorial_markers_cache`,
    removedMarkerIdsCache: `${prefix}_memorial_removed_marker_ids_cache`,
    gallery: `${prefix}_gallery_images`,
    galleryCache: `${prefix}_gallery_cache`,
    galleryVersion: `${prefix}_gallery_version`,
    quotes: `${prefix}_all_quotes`,
    quotesMigrated: `${prefix}_quotes_migrated_v2`,
    quotesCache: `${prefix}_all_quotes_cache`,
    archives: `${prefix}_all_archives`,
    archivesMigrated: `${prefix}_archives_migrated_v1`,
    archivesTagsSeed: `${prefix}_archives_tags_seeded_v2`,
    archivesCache: `${prefix}_all_archives_cache`,
    locale: `${prefix}_locale`,
    markerTags: `${prefix}_marker_tag_registry`,
    archiveTags: `${prefix}_archive_tag_registry`,
  };
}

export function getBranding() {
  return {
    siteTitle: '某某同志生平纪念地图',       // ← 站点标题
    siteSubtitle: '交互式历史足迹地图',
    siteDescription: '记录足迹、历史事件和题字地点',
    headerLink: null,                          // 顶栏标题外链，无则 null
    exportProjectName: '某某纪念地图',
    exportFilePrefix: 'my-memorial',
    quotesPanelSubtitle: 'Quotes Library',
    archivePanelSubtitle: 'Historical Archives',
    countdownLabel: '距里程碑',
    milestoneDate: '2030-01-01',               // 倒计时目标日
    milestoneDisplay: '2030.1.1',
  };
}

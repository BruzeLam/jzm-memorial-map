# 江泽民同志生平纪念地图

## 项目信息

- **仓库**: BruzeLam/jzm-memorial-map
- **默认分支**: `main` ✅ （所有开发都在 main 分支上）
- **语言**: 中文（请始终用中文交流）
- **框架**: React + Leaflet（地图库）

## 核心功能

### 1. 地点标记系统 (Markers)
- 添加、编辑、删除地点
- 支持两种添加模式：地图标点或手动输入
- 地点包含：名称、坐标、类型、日期、标题、描述、资源链接、图片等

### 2. 图片系统 (Gallery)
- **影像馆** (`/components/GalleryPanel.jsx`)：独立的图片库，按时间倒序排列
- **地点图片**：地点可上传多张图片，自动同步到影像馆
- **双向关联**：
  - 地点上传图片 → 自动添加到影像馆
  - 影像馆编辑图片 → 可关联到已有地点
- **图片功能**：
  - 压缩（使用 Canvas API，自动转 WebP 格式，最大 1200×1200）
  - 编辑标题、描述、关联地点
  - 全屏查看
  - 搜索（按标题、地址、描述）

### 3. 其他功能
- **搜索和筛选**：按名称、类型、日期、地区搜索
- **长者语录** (`QuotesPanel`)：显示古籍、新闻报道等资源
- **详情面板** (`DetailPanel`)：显示完整标记信息和图片库
- **响应式布局**：地图占主区域，侧边栏支持收起/展开

## 关键文件

```
src/
├── components/
│   ├── App.jsx                    # 主应用，处理图片同步
│   ├── AddMarkerForm.jsx          # 地点添加/编辑表单
│   ├── GalleryPanel.jsx           # 影像馆弹窗
│   ├── GalleryImageEditor.jsx     # 图片编辑面板
│   ├── ImageViewer.jsx            # 全屏图片查看
│   ├── Header.jsx                 # 顶部栏（包含【影像馆】和【长者语录】按钮）
│   ├── Sidebar.jsx                # 侧边栏（地点列表、搜索、添加）
│   ├── DetailPanel.jsx            # 详情面板
│   ├── Map.jsx                    # Leaflet 地图
│   └── ...
├── hooks/
│   ├── useMarkers.js              # 地点管理 hook
│   ├── useGallery.js              # 影像馆管理 hook（localStorage 存储）
│   ├── useSearch.js               # 搜索筛选 hook
│   └── ...
├── utils/
│   ├── imageCompression.js        # 图片压缩工具
│   ├── constants.js               # 常量定义（标记类型等）
│   └── ...
```

## 最近工作进度

✅ **已完成**:
1. 图片压缩系统（Canvas API，WebP 格式，自动缩放）
2. 影像馆功能完整实现
3. 图片编辑面板（标题、描述、地点关联）
4. 地点和影像馆的双向同步
5. **图片同步 bug 修复**：地点上传的图片现在会自动添加到影像馆

## 常用命令

```bash
# 启动开发服务器
npm start

# 编译生产版本
npm run build

# 运行测试
npm test

# 推送到 main 分支
git push origin main
```

## 上次更新

2026-05-25 网络连接修复与版本稳定化 ✅

**网络状态恢复：**
- 排查并修复Claude Code环境的GitHub连接问题
- 确认git push和GitHub/Vercel同步正常工作
- 网络配置已调整，后续推送应无障碍

**版本管理：**
- 回退代码到 `a7f258e`（特性：关闭浮窗卡时自动缩放回退）
- 确保应用稳定性，专注于核心数据添加工作
- 暂停UI优化，待数据充实后再考虑filter设计改进

**当前优先级：**
- 📝 手动添加真实的长者语录与地点信息
- 🗺️ 充实纪念地点数据库
- 📸 收集与上传相关历史图片资料

---

**重要提示**: 
- 所有开发都在 `main` 分支，不要切换到其他分支
- 图片存储在 localStorage（Base64 格式）
- React 国际化中文：见 Header 和各个组件

# memorial-map-core · Cursor Agent Skill

供 **Fork 本仓库、复用纪念地图产品结构** 时使用。安装 Cursor 后打开本仓库即可自动发现；也可复制到其他项目。

## 在 Cursor 中使用

本 Skill 已放在两处（内容同步）：

| 路径 | 用途 |
|------|------|
| [`.cursor/skills/memorial-map-core/SKILL.md`](../../.cursor/skills/memorial-map-core/SKILL.md) | Cursor 项目 Skill（推荐） |
| [`skills/memorial-map-core/SKILL.md`](./SKILL.md) | GitHub 浏览、文档与模板 |

对 Agent 说例如：

- 「按 memorial-map-core skill，帮我把这个项目 fork 成某某人物纪念地图」
- 「复用这个产品结构，要改哪些 branding 和 data 文件？」
- 「只开 localStorage 版，不上 Supabase，怎么走最小路径？」

## 文档索引

- [SKILL.md](./SKILL.md) — 主入口与 Fork 清单  
- [FORK-CHECKLIST.md](./FORK-CHECKLIST.md) — 逐步勾选  
- [SETUP.md](./SETUP.md) — 环境、Storage、图片、高德  
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 架构分层  
- [DATA-MODELS.md](./DATA-MODELS.md) — 数据结构  
- [DIRECTORY-STRUCTURE.md](./DIRECTORY-STRUCTURE.md) — 源码目录  

## 模板

- [`templates/branding.template.js`](./templates/branding.template.js)  
- [`templates/constants.template.js`](./templates/constants.template.js)  

## 上游实例

- 仓库：https://github.com/BruzeLam/jzm-memorial-map  
- 产品规格：[docs/PRD.md](../../docs/PRD.md)  
- 上云部署：[docs/ADMIN_SETUP.md](../../docs/ADMIN_SETUP.md)  
- 作品集模式：[docs/PORTFOLIO.md](../../docs/PORTFOLIO.md)  

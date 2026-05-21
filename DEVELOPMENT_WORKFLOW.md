# 个人开发者完整工作流指南：Claude Code + GitHub + Vercel

> 本指南基于真实项目经验，适合0-1个人开发者快速启动 Web 项目。从代码编辑到自动部署，完全无需本地环境配置。

---

## 🎯 核心平台简介

| 平台 | 作用 | 是否必需 | 成本 |
|------|------|--------|------|
| **Claude Code** | 开发 IDE，支持 Claude AI 助手 | ✅ 必需 | 需 Claude 订阅 |
| **GitHub** | 代码版本控制 + 托管 | ✅ 必需 | 免费（Public repo） |
| **Vercel** | 自动部署 + 静态/Node 托管 | ✅ 必需 | 免费（个人项目） |
| **Domains** (可选) | 自定义域名 | ❌ 可选 | $12-15/年 |
| **GitHub Actions** (可选) | CI/CD 自动化 | ❌ 可选 | 免费额度 |

---

## 📋 前置准备清单（5分钟）

### 1. GitHub 账户创建和配置
```
⏱️ 需要时间：3分钟
```

1. 访问 **https://github.com/signup** 注册账户
2. 验证邮箱
3. 在 **Settings → Developer settings → Personal access tokens** 生成 Token：
   - 点 **Generate new token (classic)**
   - ✅ 勾选权限：`repo`, `workflow`
   - 📝 保存 Token（格式：`ghp_...`）

> ⚠️ Token 是你的 GitHub 密钥，不要分享！每次推送代码时需要用到。

### 2. Vercel 账户创建和关联
```
⏱️ 需要时间：2分钟
```

1. 访问 **https://vercel.com/signup**
2. 用 GitHub 账户登录（选择 "Continue with GitHub"）
3. 授权 Vercel 访问你的 GitHub 仓库
4. 完成！Vercel 会自动监听你的 GitHub 变化

---

## 🚀 完整工作流（5 步）

### 第 1 步：在 Claude Code 中创建项目（5分钟）

**方式 A：从零开始**
```bash
mkdir my-awesome-project
cd my-awesome-project
npm init -y                    # 创建 package.json
npx create-react-app .         # 或你喜欢的框架
```

**方式 B：克隆现有模板（推荐）**
```bash
git clone <template-repo>
cd template
npm install
```

---

### 第 2 步：本地开发 → 提交 GitHub（每次改动）

**Claude Code 中的 Terminal 运行：**

```bash
# 1️⃣ 查看改动
git status

# 2️⃣ 添加改动到暂存区
git add .

# 3️⃣ 提交代码（填写清晰的提交信息）
git commit -m "功能描述：具体改了什么"

# 4️⃣ 推送到 GitHub（首次需要输入 Token）
git push origin main
```

**首次推送时 Git 会要求输入用户名和密码：**
- 用户名：你的 GitHub 用户名
- 密码：粘贴刚才生成的 Personal Access Token

> 💡 提示：后续推送可以用 HTTPS URL 带 Token 的方式，避免每次都输入。

---

### 第 3 步：GitHub 仓库创建（2分钟，一次性）

1. 访问 **https://github.com/new**
2. 填写：
   - **Repository name**：项目名（英文，如 `my-memorial-map`）
   - **Description**：项目描述（可选）
   - **Public**：选择公开（免费）
3. 点 **Create repository**

**关键配置（可选，增强安全性）：**
- Settings → Branches → Add rule：保护 `main` 分支
- Settings → Secrets and variables：存储敏感信息（API Key 等）

---

### 第 4 步：Vercel 自动部署（0分钟，全自动）

**一次性配置：**
1. 访问 **https://vercel.com/new**
2. 选择 "Import Git Repository"
3. 粘贴你的 GitHub 仓库 URL
4. 点 **Import** → Vercel 自动部署

**以后的流程：**
```
你在 Claude Code 改代码
    ↓
git add . && git commit && git push
    ↓
GitHub 接收 push
    ↓
Vercel 自动检测到代码变化
    ↓
自动构建 + 部署
    ↓
1-2分钟内网站更新 ✅
```

> 你甚至不需要本地运行 `npm start`！Vercel 替你搞定。

---

### 第 5 步：获取部署链接（已自动完成）

部署完成后，你会得到：
- **默认域名**：`https://my-awesome-project.vercel.app`
- **自定义域名**（付费）：可在 Vercel Settings 配置

---

## 📊 架构图

```
┌─────────────────────────────────────────────────────┐
│                 你的本地机器                          │
│  ┌──────────────────────────────────────────────┐   │
│  │  Claude Code (IDE)                           │   │
│  │  - 编辑代码                                    │   │
│  │  - AI 助手帮助                                 │   │
│  │  - Terminal 运行 git 命令                      │   │
│  └──────┬───────────────────────────────────────┘   │
└─────────┼───────────────────────────────────────────┘
          │
          │ git push origin main
          ↓
┌─────────────────────────────────────────────────────┐
│           GitHub (代码托管)                          │
│  ┌──────────────────────────────────────────────┐   │
│  │  你的仓库                                      │   │
│  │  - 版本控制                                    │   │
│  │  - 代码备份                                    │   │
│  │  - Webhook 触发 Vercel                        │   │
│  └──────┬───────────────────────────────────────┘   │
└─────────┼───────────────────────────────────────────┘
          │
          │ 自动 Webhook
          ↓
┌─────────────────────────────────────────────────────┐
│         Vercel (自动部署 + 托管)                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  自动化流程                                    │   │
│  │  1. 检测 GitHub push                         │   │
│  │  2. 拉取代码                                  │   │
│  │  3. npm install && npm run build             │   │
│  │  4. 部署到全球 CDN                            │   │
│  │  5. 分配公网 URL                              │   │
│  └──────┬───────────────────────────────────────┘   │
└─────────┼───────────────────────────────────────────┘
          │
          ↓
   https://my-project.vercel.app
    (任何人都能访问！)
```

---

## 🛠️ 常见操作速查表

### 日常开发流程（3 命令）
```bash
git add .
git commit -m "改动描述"
git push
# 搞定！1-2分钟后网站自动更新
```

### 查看部署状态
```bash
# 在 Vercel Dashboard 查看：https://vercel.com/your-username/projects
# 每个 push 都会有一条部署记录，显示成功/失败
```

### 回滚到之前的版本
```bash
# 查看提交历史
git log --oneline

# 回到某个之前的版本
git checkout <commit-hash>

# 推送回滚
git push -f origin main
```

### 查看实时日志（调试部署失败）
```
Vercel Dashboard → 项目 → Deployments → 最新部署 → Logs
```

---

## ⚠️ 常见问题 & 解决方案

### 问题 1：Vercel 部署失败（红色错误）
**原因：** 通常是代码语法错误或依赖问题
**解决：**
1. 查看 Vercel Logs（Deployments → 最新 → Logs）
2. 找到错误信息（通常是 "cannot find module" 或 ESLint 错误）
3. 在 Claude Code 中修复
4. 重新 `git push` 或在 Vercel 点 Redeploy

### 问题 2：网页没有更新（刷新还是旧版本）
**原因：** 浏览器 CDN 缓存
**解决：**
- Windows: `Ctrl+Shift+R`
- Mac: `Cmd+Shift+R`
- 或用无痕窗口访问

### 问题 3：Token 泄露了怎么办？
**立即操作：**
1. 访问 GitHub Settings → Personal access tokens
2. 删除泄露的 Token
3. 生成新 Token
4. 后续推送用新 Token

### 问题 4：本地 git 和 GitHub 分支不同步
**解决：**
```bash
git fetch origin          # 获取最新远程信息
git status                # 查看差异
git pull origin main      # 拉取最新
git push origin main      # 推送最新
```

---

## 💡 Pro Tips（进阶优化）

### 1. 自动化 Token（避免每次输入）
```bash
# 在本地配置 Git credential helper（仅限 Mac/Linux）
git config --global credential.helper store

# 或使用 SSH 密钥（更安全）
ssh-keygen -t ed25519
# 把公钥加到 GitHub Settings → SSH keys
```

### 2. 添加 `.gitignore`（避免上传垃圾文件）
```
node_modules/
.env
dist/
build/
.DS_Store
```

### 3. 环境变量管理（存储敏感信息）
```bash
# 本地创建 .env（不上传）
API_KEY=xxx
DATABASE_URL=xxx

# Vercel 中配置：
# Settings → Environment Variables
# 粘贴变量，Vercel 会自动注入到构建环境
```

### 4. 自定义域名（可选）
```
Vercel → 项目 Settings → Domains
添加你的域名（需要先在域名注册商配置 DNS）
```

### 5. GitHub Actions 自动化（可选）
```yaml
# .github/workflows/deploy.yml
name: Auto Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install && npm run build
```

---

## 📚 完整项目示例（本项目）

| 阶段 | 操作 | 时间 |
|------|------|------|
| 1. 初始化 | `npm init` → 创建 package.json | 2分钟 |
| 2. 开发 | Claude Code 编写代码 | 30分钟 |
| 3. 提交 | `git add . && git commit && git push` | 1分钟 |
| 4. 部署 | Vercel 自动构建部署 | 1-2分钟 |
| **总耗时** | | **35分钟** |

> 传统流程需要 2-3 小时配置本地环境 + CI/CD + 服务器。这个流程只需 35 分钟。

---

## 🎓 学习资源

- **GitHub 文档**：https://docs.github.com
- **Vercel 部署指南**：https://vercel.com/docs
- **Git 快速上手**：https://git-scm.com/book/zh/v2
- **Claude Code 官方**：https://code.claude.com

---

## 总结：3 句话讲清楚

1. **Claude Code** = 你的 IDE，写代码的地方
2. **GitHub** = 你的代码库，用 git 命令推送
3. **Vercel** = 你的服务器，自动部署网站

**工作流就是：改代码 → push → Vercel 自动更新 → 完成！**

---

*最后更新：2026-05-21*
*基于个人项目实践整理*

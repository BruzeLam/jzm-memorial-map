# 江迹管理后台 · 上云配置

MVP：仅**一个超级管理员**（你的邮箱），邮箱魔法链接登录；访客无门槛只读；数据存 Supabase。

## 1. 创建 Supabase 项目

1. 打开 [supabase.com](https://supabase.com) 新建项目  
2. **Project Settings → API** 复制：
   - Project URL → `REACT_APP_SUPABASE_URL`
   - anon public key → `REACT_APP_SUPABASE_ANON_KEY`

## 2. 执行数据库脚本

在 Supabase **SQL Editor** 中打开 [`supabase/schema.sql`](../supabase/schema.sql)：

- 将文件中 **`YOUR_ADMIN_EMAIL`** 改成你的管理员邮箱（与下面环境变量一致）
- 执行整段 SQL

会创建表 `markers`、`gallery`、`site_meta`、`quotes`、`archives`，并设置：

- 所有人 **SELECT**（公开只读）
- 仅 admin 邮箱 **INSERT/UPDATE/DELETE**

## 3. 配置 Auth

1. **Authentication → Providers → Email**：开启 Email  
2. **Authentication → URL Configuration**：
   - **Site URL**：`https://jzm-memorial-map.vercel.app`
   - **Redirect URLs**（每行一个，缺一不可）：
     - `https://jzm-memorial-map.vercel.app/`
     - `https://jzm-memorial-map.vercel.app/admin`
     - `https://jzm-memorial-map.vercel.app/admin/login`
     - `http://localhost:3000/`（本地开发）
     - `http://localhost:3000/admin`
     - `http://localhost:3000/admin/login`

**一键脚本（可选）**：在 [Account Tokens](https://supabase.com/dashboard/account/tokens) 创建 Personal Access Token 后：

```bash
SUPABASE_ACCESS_TOKEN=你的token node scripts/configure-supabase-auth.mjs
```

首页点击「添加」发送魔法链接后，需 **`/` 回调** 才能回到地图并进入编辑模式。

## 4. 环境变量

本地复制 `.env.example` 为 `.env.local`：

```bash
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
REACT_APP_ADMIN_EMAIL=your@email.com
```

Vercel：**Settings → Environment Variables** 同样配置三项（Production / Preview 均可）。

未配置 Supabase 时，站点仍按原逻辑使用 **localStorage + 内置数据**，后台 `/admin` 会提示未配置。

## 5. 首次导入数据

1. 部署或本地 `npm start`（带 `.env.local`）  
2. 打开 **`/admin/login`**，用管理员邮箱收魔法链接登录  
3. **已有旧项目**若建库较早，还需在 SQL Editor 分别执行：
   - `supabase/migration-quotes.sql`（语录表）
   - `supabase/migration-archives.sql`（档案馆表，邮箱改成你的）
4. 在 **概览** 页：
   - 优先点 **「全部上云」**（本浏览器 localStorage → 地点 + 影像 + 语录 + 档案）
   - 或分块恢复：绿色「恢复地点」「上传语录」「上传档案」按钮
5. 刷新首页，地图 / 语录 / 档案馆应从云端只读加载

## 6. 日常使用

| 地址 | 用途 |
|------|------|
| `/` | 公众地图（云端只读） |
| `/admin` | 后台概览、导入、统计 |
| `/admin/markers` | 地点列表 / 编辑 / 删除 / 新建 |
| `/admin/review` | 用户提交审核（通过/驳回） |
| `/admin/collaborators` | 协作者邀请与管理（仅超级管理员） |

Git 仍可用于维护官方样本；改完 `constants.js` 后可在后台再次「导入」覆盖同 id 记录，或直接在后台编辑。

## 7. 协作者账号（多邮箱编辑）

已有数据库请执行 [`supabase/migration-collaborators.sql`](../supabase/migration-collaborators.sql)：

1. 将 **`YOUR_ADMIN_EMAIL`** 改成与 `REACT_APP_ADMIN_EMAIL` 相同的邮箱  
2. 在 Supabase SQL Editor 执行整段脚本  

会创建 `collaborators` 表、写入你的超级管理员，并将各表写权限从「单邮箱硬编码」改为「协作者列表」。

| 角色 | 权限 |
|------|------|
| **admin** | 编辑全部内容 + `/admin/collaborators` 邀请/移除 |
| **editor** | 编辑地图与后台内容，不可管理账号 |

日常：登录后打开 **`/admin/collaborators`** → 添加协作者邮箱 → 点「发登录链接」让对方首次登录。

> ⚠️ **务必先执行迁移再部署前端**，否则 RLS 仍认旧策略；迁移后若未写入你的邮箱，将失去写权限。

## 8. 用户提交待审（阶段 A）

执行 [`supabase/migration-submissions.sql`](../supabase/migration-submissions.sql)（需已执行 collaborators 迁移）。

| 角色 | 添加地点行为 |
|------|-------------|
| 访客 | 只读；点「添加」→ 登录 |
| 已登录非协作者 | 提交进 `submissions` 表，**待审核** |
| 协作者 / 超管 | 直接写入正式 `markers` 表 |

测试：用**未加入 collaborators 的邮箱**魔法链接登录 → 添加地点 → 应看到「已提交审核」弹窗；数据在 Supabase `submissions` 表，**不会**立刻出现在公开地图。

**审核**：登录协作者账号 → **`/admin/review`** → 预览待审内容 → **通过并发布**（写入正式 markers + 影像）或 **驳回**。

下一阶段：开放公众注册 UI（阶段 C）。

## 9. 安全说明

- 写权限由 Supabase **RLS** 按 JWT 邮箱约束，务必保证 SQL 中 admin 邮箱正确  
- 勿将 `service_role` key 放入前端环境变量  
- 后台路径 `/admin` 无 obscurity 保护，依赖 Auth + RLS；后续可加 IP 限制或二次验证

## 10. 登录邮件频率与自定义 SMTP

首页 / 后台的魔法链接由 **Supabase Auth 发信**。免费项目默认使用 **内置 SMTP**，全项目大约只有 **每小时 2～4 封**，多人登录或反复点「发送登录链接」会触发：

`email rate limit exceeded`（429）

前端已将该错误显示为中文提示；**根本解决办法**是在 Supabase 配置 **自定义 SMTP**，并在 **Rate Limits** 里调高上限。

### 需要额外花钱吗？

| 项目 | 费用 |
|------|------|
| **Supabase 免费版** | 继续可用，**不必**为解除发信限制而升级 Pro |
| **Vercel 托管** | 不变（你已在用） |
| **自定义 SMTP** | 多数有 **免费额度**，朋友小规模贡献通常 **0 元** |
| **自有域名**（可选） | 若要用 `no-reply@你的域名.com` 发信，域名约 **¥50～80/年**；也可用 Resend 等提供的测试域名先跑通 |

**结论**：给几个朋友用，**可以先 0 元**（Resend 免费档约 3000 封/月）；只有用户量上来或要专业发信域名时才可能需要付费。

### 推荐：Resend + Supabase（约 10 分钟）

1. 注册 [resend.com](https://resend.com)（免费档即可）  
2. 创建 API Key；若有自己的域名，在 Resend 添加域名并按提示配 **DNS（SPF/DKIM）**  
3. 打开 Supabase → **Project Settings → Authentication → SMTP Settings**  
4. 开启 **Enable Custom SMTP**，示例填写：

   | 字段 | Resend 示例值 |
   |------|----------------|
   | Host | `smtp.resend.com` |
   | Port | `587` |
   | Username | `resend` |
   | Password | 你的 Resend API Key |
   | Sender email | `onboarding@resend.dev`（测试）或 `no-reply@你的域名` |
   | Sender name | `江泽民同志生平纪念地图` |

5. 保存后，到 **Authentication → Rate Limits** 调整（需已启用自定义 SMTP）：
   - **Email sent**：例如 `30`～`100` / 小时（按实际人数）  
   - **OTP requests per hour**：同上量级  
   - **OTP period**：同一邮箱两次请求间隔，默认 60 秒，测试可略降，生产勿太低  

6. 用朋友邮箱再试一次「发送登录链接」，确认不再 429。

### ⚠️ `onboarding@resend.dev` 只能发给自己

脚本默认发件人为 **`onboarding@resend.dev`**（Resend 共享测试域）。此模式下 **只能向 Resend 注册账号本人的邮箱发信**，给朋友或其他域名发信会被 Resend 拒绝，Supabase 返回英文：

`Error sending confirmation email`

前端已将该错误转为中文说明。**要让朋友也能登录**，必须：

1. 在 Resend **Domains** 添加并验证你的域名（DNS 配 SPF / DKIM）  
2. 把 Supabase SMTP 发件人改为 `no-reply@你的域名`（或 Resend 验证过的地址）  
3. 重新执行 `node scripts/configure-supabase-smtp.mjs`，并设置环境变量：

```bash
SMTP_SENDER=no-reply@你的域名.com \
SUPABASE_ACCESS_TOKEN=sbp_... \
RESEND_API_KEY=re_... \
node scripts/configure-supabase-smtp.mjs
```

4. 在 [Resend → Logs](https://resend.com/emails) 确认发往朋友邮箱的状态为 **Delivered**

### 其他 SMTP 服务

Brevo、SendGrid、AWS SES、腾讯/阿里企业邮等均可，只要提供标准 SMTP 主机、端口、账号密码。配置路径相同。

### 仍被限流时

1. 查 **Authentication → Logs** 是否仍为 `over_email_send_rate_limit`  
2. 确认 **Custom SMTP** 已保存且发信测试成功  
3. 查邮箱是否已有 **未过期魔法链接**（通常约 1 小时内有效），可直接点开，无需重发  
4. Resend / 发信服务商控制台查看是否因配额或域名未验证被拒

### Management API（可选）

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/你的PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email_enabled": true,
    "smtp_admin_email": "no-reply@example.com",
    "smtp_host": "smtp.resend.com",
    "smtp_port": 587,
    "smtp_user": "resend",
    "smtp_pass": "你的Resend_API_Key",
    "smtp_sender_name": "江泽民同志生平纪念地图"
  }'
```

Rate Limits 建议在 Dashboard 图形界面调整，更直观。

### Dashboard 打不开时（国内网络常见）

`supabase.com` 控制台在部分地区无法访问，可改用 **Management API + 本仓库脚本**（无需打开 Auth → SMTP 页面）：

1. **Resend API Key**：在 Resend 控制台已生成（`re_...`）  
2. **Supabase Personal Access Token**：需能访问一次  
   https://supabase.com/dashboard/account/tokens  
   （若打不开，请开 **VPN** 或换网络/DNS `1.1.1.1` 后再试）  
3. 在本项目根目录终端执行（**勿把 Key 写进代码或 commit**）：

```bash
SUPABASE_ACCESS_TOKEN=sbp_你的SupabaseToken \
RESEND_API_KEY=re_你的ResendKey \
node scripts/configure-supabase-smtp.mjs
```

脚本会写入 Resend SMTP，并把 `rate_limit_email_sent` / `rate_limit_otp` 调到 50/小时（可用环境变量 `RATE_LIMIT_EMAIL` 覆盖）。

若 `api.supabase.com` 也连不上，只能 VPN 后再跑上述命令。

## 11. 图片对象存储（P2-05）

地点 / 影像馆 / 档案馆 / 待审提交中的图片，保存时会自动上传到 Supabase **Storage**（bucket `images`），数据库 `payload` 里只存公开 URL，不再把 Base64 塞进 JSONB。

### 首次启用（必做）

1. 在 Supabase **SQL Editor** 执行（需已执行 `migration-collaborators.sql`，依赖 `public.is_editor()`）：

   `supabase/migration-storage.sql`

2. 部署含本功能的代码后，用**协作者账号**登录 → **`/admin`** → 点击 **「迁移云端 Base64 图片 → Storage」**，把已有 Base64 批量迁出（新保存的数据会自动上传，无需重复点）。

### 权限说明

| 操作 | 谁可以 |
|------|--------|
| 公开读图片 URL | 所有人 |
| 上传（insert） | 已登录用户（贡献者提交、协作者编辑） |
| 更新 / 删除 Storage 对象 | 协作者（`is_editor()`） |

### 仍用 localStorage 的访客

未登录或未启用云端时，图片仍按原逻辑存 Base64；上云保存时才写入 Storage。

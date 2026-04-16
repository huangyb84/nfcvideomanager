# NFC 视频链接管理系统

通过固定 NFC 链接管理可更换的视频内容。手机触发 NFC 标签后无感打开并播放视频。

## 功能特性

- ✅ 固定 NFC 链接，视频内容可随时更换
- ✅ 视频上传到 Supabase 存储
- ✅ 简洁的管理后台
- ✅ 移动端优化的播放页面
- ✅ 自动播放、屏幕常亮、全屏优化

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

#### 2.1 创建 Supabase 项目

1. 访问 [https://app.supabase.com](https://app.supabase.com)
2. 创建新项目
3. 获取项目 URL 和 Anon Key（在 Settings → API）

#### 2.2 创建数据库表

在 Supabase SQL Editor 中执行：

```sql
-- 创建 NFC 视频链接表
CREATE TABLE nfc_videos (
  id BIGSERIAL PRIMARY KEY,
  short_id TEXT UNIQUE NOT NULL,
  video_url TEXT NOT NULL,
  title TEXT DEFAULT 'NFC Video',
  description TEXT,
  nfc_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_short_id ON nfc_videos(short_id);
CREATE INDEX idx_active ON nfc_videos(active);
```

#### 2.3 创建 Storage Bucket

1. 进入 Storage 页面
2. 创建新 Bucket，名称：`nfc-videos`
3. 设置为 **Public**（公开访问）
4. 上传权限设置为允许匿名用户

#### 2.4 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 Supabase 配置：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PORT=3000
BASE_URL=http://localhost:3000  # 部署时改为你的域名
```

### 3. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

访问：
- 📱 管理后台：http://localhost:3000/admin.html
- 🔗 NFC 链接示例：http://localhost:3000/v/abc123

## 使用流程

### 创建 NFC 视频链接

1. 访问管理后台
2. 上传视频文件（支持 MP4、WebM 等，最大 100MB）
3. 填写标题和描述（可选）
4. 点击"上传并创建链接"
5. 复制生成的 NFC 链接

### 写入 NFC 标签

使用 NFC 写入工具（如 NXP TagWriter）：

1. 打开 NFC 写入应用
2. 选择"写入 URL"
3. 粘贴生成的 NFC 链接（如 `http://localhost:3000/v/abc123`）
4. 将手机靠近 NFC 标签写入

### 更换视频内容

1. 在管理后台找到对应链接
2. 上传新视频
3. 系统会生成新的视频链接
4. 更新数据库记录（未来可添加编辑功能）

## 部署建议

### Vercel 部署

```bash
npm i -g vercel
vercel
```

### Railway 部署

1. 连接 GitHub 仓库
2. 添加环境变量
3. 自动部署

### 环境变量（生产环境）

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PORT=3000
BASE_URL=https://your-domain.com  # 你的实际域名
```

## API 接口

### 上传视频
```
POST /api/upload
Content-Type: multipart/form-data

Response: { success: true, videoUrl: string }
```

### 创建链接
```
POST /api/links
Content-Type: application/json

Body: { videoUrl, title, description }
Response: { success: true, data: { shortId, nfcUrl } }
```

### 获取所有链接
```
GET /api/links
Response: { success: true, data: [] }
```

### 更新链接
```
PUT /api/links/:id
Content-Type: application/json

Body: { videoUrl?, title?, description?, active? }
```

### 删除链接
```
DELETE /api/links/:id
Response: { success: true }
```

## 技术栈

- **后端**：Node.js + Express
- **数据库**：Supabase (PostgreSQL)
- **存储**：Supabase Storage
- **前端**：原生 HTML + Tailwind CSS
- **部署**：Vercel / Railway / 任意 Node.js 主机

## 注意事项

1. **视频大小**：建议控制在 50MB 以内，保证加载速度
2. **视频格式**：推荐使用 MP4 (H.264 编码)，兼容性最好
3. **域名配置**：生产环境务必配置 `BASE_URL`，否则 NFC 链接不正确
4. **安全性**：生产环境建议添加管理员认证
5. **性能优化**：可考虑使用 CDN 加速视频加载

## 许可证

MIT

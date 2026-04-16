# Supabase 配置指南

## ✅ 已完成
- `.env` 文件已配置你的 Supabase 项目

## 📋 需要手动操作的步骤

### 1. 执行 SQL 创建数据库表

1. 访问 [https://nmlcpisjdfzfnudsedrf.supabase.co](https://nmlcpisjdfzfnudsedrf.supabase.co)
2. 使用密码 `Nfcvideo123@` 登录
3. 进入 **SQL Editor** 页面
4. 复制并执行 `supabase_setup.sql` 文件中的 SQL 语句
5. 点击 **Run** 执行

或者直接在 SQL Editor 中执行以下 SQL：

```sql
-- 创建表
CREATE TABLE IF NOT EXISTS nfc_videos (
  id BIGSERIAL PRIMARY KEY,
  short_id TEXT UNIQUE NOT NULL,
  video_url TEXT NOT NULL,
  title TEXT DEFAULT 'NFC Video',
  description TEXT,
  nfc_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_short_id ON nfc_videos(short_id);
CREATE INDEX IF NOT EXISTS idx_active ON nfc_videos(active);

-- 启用 RLS
ALTER TABLE nfc_videos ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "允许匿名读取活跃视频" ON nfc_videos FOR SELECT USING (active = true);
CREATE POLICY "允许匿名插入" ON nfc_videos FOR INSERT WITH CHECK (true);
CREATE POLICY "允许匿名更新" ON nfc_videos FOR UPDATE USING (true);
CREATE POLICY "允许匿名删除" ON nfc_videos FOR DELETE USING (true);
```

### 2. 创建 Storage Bucket

1. 进入 **Storage** 页面
2. 点击 **New bucket**
3. 填写：
   - **Name**: `nfc-videos`
   - **Public**: ✅ 勾选（设为公开）
   - **File size limit**: `100000000` (100MB)
4. 点击 **Create bucket**

### 3. 配置 Storage 策略（允许匿名上传）

1. 在 Storage 页面，点击 `nfc-videos` bucket
2. 进入 **Policies** 标签
3. 点击 **New policy**
4. 选择 **Create a policy from scratch**
5. 填写：
   - **Policy name**: `允许匿名上传`
   - **Allowed operation**: `INSERT`, `SELECT`, `UPDATE`, `DELETE`
   - **Target roles**: `anon`
   - **Policy definition**: 
     ```sql
     true
     ```
6. 点击 **Review** 然后 **Save policy**

或者使用 SQL Editor 执行：

```sql
-- 为 Storage bucket 创建策略
CREATE POLICY "允许匿名访问视频存储" ON storage.objects
  FOR ALL
  USING (bucket_id = 'nfc-videos')
  WITH CHECK (bucket_id = 'nfc-videos');
```

## ✅ 验证配置

完成上述步骤后，运行以下命令启动服务：

```bash
npm start
```

然后访问 http://localhost:3000/admin.html 测试上传视频功能。

## 🔧 故障排查

### 问题：上传视频失败
- 检查 Storage bucket 是否创建
- 检查 bucket 是否为 Public
- 检查 Storage 策略是否正确

### 问题：创建链接失败
- 检查数据库表是否创建
- 检查 RLS 策略是否正确
- 查看浏览器控制台和服务器日志

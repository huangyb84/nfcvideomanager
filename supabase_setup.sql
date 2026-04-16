-- NFC 视频链接管理系统 - Supabase 数据库设置脚本
-- 在 Supabase SQL Editor 中执行以下 SQL

-- 创建 NFC 视频链接表
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

-- 启用 Row Level Security (RLS)
ALTER TABLE nfc_videos ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许匿名读取（NFC 访问需要）
CREATE POLICY "允许匿名读取活跃视频" ON nfc_videos
  FOR SELECT
  USING (active = true);

-- 创建策略：允许匿名插入（上传视频需要）
CREATE POLICY "允许匿名插入" ON nfc_videos
  FOR INSERT
  WITH CHECK (true);

-- 创建策略：允许匿名更新
CREATE POLICY "允许匿名更新" ON nfc_videos
  FOR UPDATE
  USING (true);

-- 创建策略：允许匿名删除
CREATE POLICY "允许匿名删除" ON nfc_videos
  FOR DELETE
  USING (true);

-- 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nfc_videos_updated_at
  BEFORE UPDATE ON nfc_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 测试数据（可选）
-- INSERT INTO nfc_videos (short_id, video_url, title, description, nfc_url, active)
-- VALUES ('test123', 'https://example.com/video.mp4', '测试视频', '这是一个测试视频', 'http://localhost:3000/v/test123', true);

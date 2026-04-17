-- Phase 1: 升级数据库结构
-- 在 Supabase SQL Editor 中执行

-- 1. 创建 NFC 链接表（永久链接）
CREATE TABLE IF NOT EXISTS nfc_links (
  id BIGSERIAL PRIMARY KEY,
  short_id TEXT UNIQUE NOT NULL,
  nfc_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建视频内容表（可变内容）
CREATE TABLE IF NOT EXISTS video_contents (
  id BIGSERIAL PRIMARY KEY,
  nfc_link_id BIGINT REFERENCES nfc_links(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_file_path TEXT,
  title TEXT DEFAULT '视频内容',
  description TEXT,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_nfc_links_short_id ON nfc_links(short_id);
CREATE INDEX IF NOT EXISTS idx_nfc_links_active ON nfc_links(is_active);
CREATE INDEX IF NOT EXISTS idx_video_contents_link_id ON video_contents(nfc_link_id);
CREATE INDEX IF NOT EXISTS idx_video_contents_current ON video_contents(is_current);

-- 4. 启用 RLS
ALTER TABLE nfc_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_contents ENABLE ROW LEVEL SECURITY;

-- 5. 创建策略
CREATE POLICY "允许匿名读取活跃 NFC 链接" ON nfc_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "允许匿名插入 NFC 链接" ON nfc_links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "允许匿名更新 NFC 链接" ON nfc_links
  FOR UPDATE USING (true);

CREATE POLICY "允许匿名删除 NFC 链接" ON nfc_links
  FOR DELETE USING (true);

CREATE POLICY "允许匿名读取视频内容" ON video_contents
  FOR SELECT USING (true);

CREATE POLICY "允许匿名插入视频内容" ON video_contents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "允许匿名更新视频内容" ON video_contents
  FOR UPDATE USING (true);

CREATE POLICY "允许匿名删除视频内容" ON video_contents
  FOR DELETE USING (true);

-- 6. 迁移现有数据（如果有的话）
-- 将旧的 nfc_videos 数据迁移到新表
INSERT INTO nfc_links (short_id, nfc_url, title, description, is_active, created_at)
SELECT short_id, nfc_url, title, description, active, created_at
FROM nfc_videos
ON CONFLICT (short_id) DO NOTHING;

-- 迁移视频内容
INSERT INTO video_contents (nfc_link_id, video_url, title, description, is_current, created_at)
SELECT nl.id, nv.video_url, nv.title, nv.description, true, nv.created_at
FROM nfc_videos nv
JOIN nfc_links nl ON nv.short_id = nl.short_id
ON CONFLICT DO NOTHING;

-- 7. 创建视图（兼容旧代码）
CREATE OR REPLACE VIEW v_nfc_videos AS
SELECT 
  nl.id,
  nl.short_id,
  vc.video_url,
  vc.title,
  vc.description,
  nl.nfc_url,
  nl.is_active as active,
  nl.created_at
FROM nfc_links nl
LEFT JOIN video_contents vc ON nl.id = vc.nfc_link_id AND vc.is_current = true
WHERE nl.is_active = true;

-- 8. 可选：删除旧表（确认迁移成功后再执行）
-- DROP TABLE IF EXISTS nfc_videos;

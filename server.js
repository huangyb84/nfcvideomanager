require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { nanoid } = require('nanoid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Supabase 客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 配置 multer 内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB 限制
  },
});

// 重定向路由 - NFC 触发访问
app.get('/v/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查询数据库获取视频链接
    const { data, error } = await supabase
      .from('nfc_videos')
      .select('video_url, title')
      .eq('short_id', id)
      .eq('active', true)
      .single();

    if (error || !data) {
      return res.status(404).send(`
        <div style="text-align:center;padding:50px;font-family:system-ui;">
          <h1>❌ 视频不存在</h1>
          <p>该 NFC 标签关联的视频不存在或已停用</p>
        </div>
      `);
    }

    // 重定向到播放页面
    res.redirect(`/play.html?id=${id}&url=${encodeURIComponent(data.video_url)}&title=${encodeURIComponent(data.title || 'NFC Video')}`);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).send('Server error');
  }
});

// API: 上传视频
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择视频文件' });
    }

    // 清理文件名：只保留扩展名，移除特殊字符
    const ext = path.extname(req.file.originalname).toLowerCase().replace(/[^a-z0-9.]/gi, '');
    const safeFileName = `${Date.now()}-${nanoid(12)}${ext || '.mp4'}`;
    
    // 上传到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('nfc-videos')
      .upload(safeFileName, req.file.buffer, {
        contentType: req.file.mimetype,
        duplex: 'half',
      });

    if (uploadError) throw uploadError;

    // 获取公开访问链接
    const { data: { publicUrl } } = supabase
      .storage
      .from('nfc-videos')
      .getPublicUrl(safeFileName);

    res.json({ 
      success: true, 
      videoUrl: publicUrl,
      fileName: uploadData.path 
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: '上传失败：' + err.message });
  }
});

// API: 创建 NFC 链接映射
app.post('/api/links', async (req, res) => {
  try {
    const { videoUrl, title, description } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: '视频链接不能为空' });
    }

    const shortId = nanoid(6); // 生成 6 位短 ID
    
    const { data, error } = await supabase
      .from('nfc_videos')
      .insert({
        short_id: shortId,
        video_url: videoUrl,
        title: title || 'NFC Video',
        description: description || '',
        nfc_url: `${BASE_URL}/v/${shortId}`,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      data: {
        id: data.id,
        shortId: data.short_id,
        nfcUrl: data.nfc_url,
        videoUrl: data.video_url,
        title: data.title,
        createdAt: data.created_at
      }
    });
  } catch (err) {
    console.error('Create link error:', err);
    res.status(500).json({ error: '创建失败：' + err.message });
  }
});

// API: 获取所有链接
app.get('/api/links', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('nfc_videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Get links error:', err);
    res.status(500).json({ error: '获取失败：' + err.message });
  }
});

// API: 更新链接
app.put('/api/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { videoUrl, title, description, active } = req.body;

    const updateData = {};
    if (videoUrl) updateData.video_url = videoUrl;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from('nfc_videos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error('Update link error:', err);
    res.status(500).json({ error: '更新失败：' + err.message });
  }
});

// API: 删除链接
app.delete('/api/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('nfc_videos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('Delete link error:', err);
    res.status(500).json({ error: '删除失败：' + err.message });
  }
});

// 启动服务器（本地开发）
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 NFC 视频管理服务已启动`);
    console.log(`📱 本地访问：http://localhost:${PORT}`);
    console.log(`🔗 管理后台：http://localhost:${PORT}/admin.html`);
    console.log(`📌 NFC 链接示例：http://localhost:${PORT}/v/abc123`);
  });
}

// 导出给 Vercel Serverless 使用
module.exports = app;

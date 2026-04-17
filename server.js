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
    
    // 先尝试从新表查询
    let { data: nfcLink, error: linkError } = await supabase
      .from('nfc_links')
      .select(`
        *,
        video_contents (
          video_url,
          title,
          description
        )
      `)
      .eq('short_id', id)
      .eq('is_active', true)
      .single();

    // 如果新表没有，尝试从旧表查询（兼容模式）
    if (linkError || !nfcLink) {
      const { data: oldData, error: oldError } = await supabase
        .from('nfc_videos')
        .select('video_url, title')
        .eq('short_id', id)
        .eq('active', true)
        .single();
      
      if (oldError || !oldData) {
        return res.status(404).send(`
          <div style="text-align:center;padding:50px;font-family:system-ui;">
            <h1>❌ 视频不存在</h1>
            <p>该 NFC 标签关联的视频不存在或已停用</p>
          </div>
        `);
      }
      
      // 重定向到播放页面（旧格式）
      return res.redirect(`/play.html?id=${id}&url=${encodeURIComponent(oldData.video_url)}&title=${encodeURIComponent(oldData.title || 'NFC Video')}`);
    }

    // 获取当前绑定的视频
    const currentVideo = nfcLink.video_contents?.find(vc => vc.is_current);
    
    if (!currentVideo) {
      return res.status(404).send(`
        <div style="text-align:center;padding:50px;font-family:system-ui;">
          <h1>⚠️ 未绑定视频</h1>
          <p>该 NFC 标签尚未绑定视频内容</p>
          <p style="margin-top:20px;">
            <a href="/admin.html" style="color:#0070f3;">前往管理后台</a>
          </p>
        </div>
      `);
    }

    // 重定向到播放页面
    res.redirect(`/play.html?id=${id}&url=${encodeURIComponent(currentVideo.video_url)}&title=${encodeURIComponent(currentVideo.title || nfcLink.title || 'NFC Video')}`);
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

// ==================== Phase 1 新增 API ====================

// API: 批量生成 NFC 链接
app.post('/api/nfc-links/generate', async (req, res) => {
  try {
    const { count = 10, prefix = '' } = req.body;
    const links = [];
    
    for (let i = 0; i < count; i++) {
      const shortId = prefix + nanoid(6);
      const nfcUrl = `${BASE_URL}/v/${shortId}`;
      
      const { data, error } = await supabase
        .from('nfc_links')
        .insert({
          short_id: shortId,
          nfc_url: nfcUrl,
          title: `NFC 链接 ${shortId}`,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      links.push(data);
    }

    res.json({ 
      success: true, 
      data: links,
      message: `成功生成 ${count} 个 NFC 链接`
    });
  } catch (err) {
    console.error('Generate NFC links error:', err);
    res.status(500).json({ error: '生成失败：' + err.message });
  }
});

// API: 获取所有 NFC 链接
app.get('/api/nfc-links', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('nfc_links')
      .select(`
        *,
        video_contents (
          id,
          video_url,
          title,
          is_current,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 格式化数据
    const formattedData = data.map(link => ({
      ...link,
      current_video: link.video_contents?.find(vc => vc.is_current) || null
    }));

    res.json({ success: true, data: formattedData });
  } catch (err) {
    console.error('Get NFC links error:', err);
    res.status(500).json({ error: '获取失败：' + err.message });
  }
});

// API: 绑定视频到 NFC 链接
app.post('/api/nfc-links/:id/bind', async (req, res) => {
  try {
    const { id } = req.params;
    const { videoUrl, title, description, videoFilePath } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: '视频链接不能为空' });
    }

    // 1. 验证 NFC 链接存在
    const { data: nfcLink, error: linkError } = await supabase
      .from('nfc_links')
      .select('*')
      .eq('id', id)
      .single();

    if (linkError || !nfcLink) {
      return res.status(404).json({ error: 'NFC 链接不存在' });
    }

    // 2. 将现有视频标记为非当前
    await supabase
      .from('video_contents')
      .update({ is_current: false })
      .eq('nfc_link_id', id);

    // 3. 创建新的视频内容
    const { data: videoContent, error: videoError } = await supabase
      .from('video_contents')
      .insert({
        nfc_link_id: id,
        video_url: videoUrl,
        video_file_path: videoFilePath || '',
        title: title || '视频内容',
        description: description || '',
        is_current: true,
      })
      .select()
      .single();

    if (videoError) throw videoError;

    res.json({ 
      success: true, 
      data: {
        nfcLink,
        videoContent
      },
      message: '视频绑定成功'
    });
  } catch (err) {
    console.error('Bind video error:', err);
    res.status(500).json({ error: '绑定失败：' + err.message });
  }
});

// API: 解绑视频
app.delete('/api/nfc-links/:id/unbind', async (req, res) => {
  try {
    const { id } = req.params;

    // 将当前视频标记为非当前
    const { error } = await supabase
      .from('video_contents')
      .update({ is_current: false })
      .eq('nfc_link_id', id)
      .eq('is_current', true);

    if (error) throw error;

    res.json({ 
      success: true, 
      message: '解绑成功'
    });
  } catch (err) {
    console.error('Unbind video error:', err);
    res.status(500).json({ error: '解绑失败：' + err.message });
  }
});

// API: 上传视频并自动绑定到 NFC 链接
app.post('/api/nfc-links/:id/upload-bind', upload.single('video'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: '请选择视频文件' });
    }

    // 1. 上传视频到 Supabase
    const ext = path.extname(req.file.originalname).toLowerCase().replace(/[^a-z0-9.]/gi, '');
    const safeFileName = `${Date.now()}-${nanoid(12)}${ext || '.mp4'}`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('nfc-videos')
      .upload(safeFileName, req.file.buffer, {
        contentType: req.file.mimetype,
        duplex: 'half',
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase
      .storage
      .from('nfc-videos')
      .getPublicUrl(safeFileName);

    // 2. 绑定到 NFC 链接
    const bindRes = await fetch(`${BASE_URL}/api/nfc-links/${id}/bind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl: publicUrl,
        videoFilePath: uploadData.path,
        title: title || '视频内容',
        description: description || '',
      }),
    });

    const bindData = await bindRes.json();

    if (!bindData.success) {
      throw new Error(bindData.error || '绑定失败');
    }

    res.json({ 
      success: true, 
      data: bindData.data,
      message: '视频上传并绑定成功'
    });
  } catch (err) {
    console.error('Upload and bind error:', err);
    res.status(500).json({ error: '操作失败：' + err.message });
  }
});

// API: 删除 NFC 链接
app.delete('/api/nfc-links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('nfc_links')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('Delete NFC link error:', err);
    res.status(500).json({ error: '删除失败：' + err.message });
  }
});

// API: 切换 NFC 链接状态
app.patch('/api/nfc-links/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    // 获取当前状态
    const { data: current } = await supabase
      .from('nfc_links')
      .select('is_active')
      .eq('id', id)
      .single();

    if (!current) {
      return res.status(404).json({ error: 'NFC 链接不存在' });
    }

    // 切换状态
    const { error } = await supabase
      .from('nfc_links')
      .update({ is_active: !current.is_active })
      .eq('id', id);

    if (error) throw error;

    res.json({ 
      success: true, 
      data: { is_active: !current.is_active },
      message: `已${!current.is_active ? '启用' : '停用'}`
    });
  } catch (err) {
    console.error('Toggle NFC link error:', err);
    res.status(500).json({ error: '操作失败：' + err.message });
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

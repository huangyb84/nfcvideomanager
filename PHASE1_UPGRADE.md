# Phase 1 升级指南

## 📋 升级内容

本次升级实现了 NFC 链接与视频内容的分离管理：

### 核心功能
- ✅ **NFC 链接永久固定** - 一次性生成，永不改变
- ✅ **视频内容可独立管理** - 上传、更换、删除
- ✅ **绑定关系可更新** - 随时更换绑定的视频
- ✅ **批量生成工具** - 一次生成多个 NFC 链接
- ✅ **完整管理界面** - 可视化管理所有链接

---

## 🚀 升级步骤

### 第一步：升级 Supabase 数据库

1. 访问 Supabase 控制台：https://supabase.com/dashboard
2. 选择你的项目：`nfcvideo`
3. 进入 **SQL Editor**
4. 打开文件：`supabase_upgrade_phase1.sql`
5. 复制全部内容并粘贴到 SQL Editor
6. 点击 **Run** 执行

**执行成功后会创建：**
- `nfc_links` 表 - 存储永久 NFC 链接
- `video_contents` 表 - 存储视频内容
- `v_nfc_videos` 视图 - 兼容旧代码

**注意：** 旧数据会自动迁移到新表，不会丢失！

---

### 第二步：上传代码到 GitHub

需要上传以下文件：

```
/Volumes/D/nfc_video/
├── server.js                    # 后端 API（已升级）
├── public/
│   └── nfc-manager.html         # 新管理后台（新增）
└── supabase_upgrade_phase1.sql  # 数据库升级脚本
```

**上传步骤：**

1. 访问：https://github.com/huangyb84/nfcvideomanager
2. 上传文件（可以直接拖拽）
3. 点击 **Commit changes**

---

### 第三步：等待 Vercel 自动部署

1. Vercel 会自动检测 GitHub 更新
2. 等待 1-2 分钟完成部署
3. 访问新管理后台：

```
https://nfcvideomanager-gkvb.vercel.app/nfc-manager.html
```

---

## 📖 使用指南

### 1. 批量生成 NFC 链接

1. 访问 `nfc-manager.html`
2. 点击 **➕ 批量生成**
3. 输入生成数量（1-100）
4. 可选：添加前缀（如 `nfc_`）
5. 点击 **生成**

**生成结果示例：**
```
https://nfcvideomanager-gkvb.vercel.app/v/abc123
https://nfcvideomanager-gkvb.vercel.app/v/def456
https://nfcvideomanager-gkvb.vercel.app/v/ghi789
```

---

### 2. 绑定视频到 NFC 链接

1. 找到对应的 NFC 链接
2. 点击 **📤 绑定视频**
3. 上传视频文件（或输入现有视频链接）
4. 填写标题和描述
5. 点击 **上传并绑定**

---

### 3. 更换视频

1. 找到已绑定视频的 NFC 链接
2. 点击 **🔄 更换**
3. 上传新视频
4. 点击 **上传并绑定**

**效果：**
- NFC 链接保持不变
- 用户扫描后立即看到新视频
- 旧视频自动解绑

---

### 4. 解绑视频

1. 找到对应的 NFC 链接
2. 点击 **⛔ 解绑**
3. 确认解绑

**注意：** 解绑后 NFC 标签将无法播放视频，需要重新绑定。

---

### 5. 启用/停用 NFC 链接

- **停用**：链接暂时失效，用户无法访问
- **启用**：链接恢复正常

---

## 🔄 新旧版本对比

| 功能 | 旧版本 | 新版本（Phase 1） |
|------|--------|------------------|
| NFC 链接 | 上传视频时生成 | 独立生成，永久固定 |
| 视频管理 | 与链接绑定 | 独立管理，可更换 |
| 批量操作 | ❌ 不支持 | ✅ 批量生成 |
| 更换视频 | ❌ 需删除重建 | ✅ 一键更换 |
| 管理界面 | 简单表单 | 完整管理后台 |

---

## ⚠️ 注意事项

### 1. 数据迁移
- 旧数据会自动迁移到新表
- 旧的管理后台（`admin.html`）仍然可用
- 新管理后台（`nfc-manager.html`）功能更完整

### 2. 兼容性
- 旧的 NFC 链接仍然有效
- 旧的播放链接仍然可用
- 新旧系统并行工作

### 3. 文件大小限制
- Vercel 免费版：**4.5MB** 上传限制
- 建议使用小视频测试（< 4MB）
- 大视频建议使用外部视频平台（腾讯视频、B 站等）

---

## 🐛 故障排查

### 问题 1：数据库表不存在

**错误信息：** `relation "nfc_links" does not exist`

**解决方法：**
1. 确认已执行 `supabase_upgrade_phase1.sql`
2. 在 Supabase SQL Editor 中重新执行

---

### 问题 2：上传视频失败

**错误信息：** `Request entity too large`

**原因：** 视频文件超过 Vercel 限制

**解决方法：**
1. 使用小视频（< 4MB）
2. 或者使用外部视频链接绑定

---

### 问题 3：NFC 链接无法访问

**检查步骤：**
1. 确认链接状态为 **✅ 启用**
2. 确认已绑定视频
3. 查看 Vercel Logs 排查错误

---

## 📊 数据库表结构

### nfc_links 表（NFC 链接）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| short_id | TEXT | 短 ID（6 位） |
| nfc_url | TEXT | 完整链接 |
| title | TEXT | 链接名称 |
| description | TEXT | 描述 |
| is_active | BOOLEAN | 是否启用 |
| created_at | TIMESTAMP | 创建时间 |

### video_contents 表（视频内容）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| nfc_link_id | BIGINT | 关联的 NFC 链接 |
| video_url | TEXT | 视频播放链接 |
| video_file_path | TEXT | 文件路径 |
| title | TEXT | 视频标题 |
| description | TEXT | 视频描述 |
| is_current | BOOLEAN | 是否当前绑定 |
| created_at | TIMESTAMP | 绑定时间 |

---

## 🎯 下一步计划

### Phase 2（增强功能）
- 📊 批量导入导出（CSV）
- 📈 数据统计（扫描次数、播放次数）
- 🏷️ 二维码生成
- 📝 绑定历史记录

### Phase 3（高级功能）
- 🔐 API 密钥管理
- 👥 多用户权限
- 📱 移动端管理界面
- 🔔 通知提醒

---

## 💬 需要帮助？

如果遇到问题：

1. 查看 Vercel Logs：https://vercel.com/dashboard
2. 检查 Supabase 数据：https://supabase.com/dashboard
3. 查看错误信息并反馈

---

**🎉 升级完成！开始使用新功能吧！**

# Vercel 部署完整指南

## ✅ 第一步：初始化 Git 并上传到 GitHub

### 1. 在终端执行以下命令

```bash
cd /Volumes/D/nfc_video

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: NFC Video Manager"

# 创建主分支
git branch -M main
```

### 2. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `nfc-video-manager`（或其他你喜欢的名字）
   - **Description**: NFC 视频链接管理系统
   - **Public** 或 **Private**（根据你的需求）
   - ❌ 不要勾选 "Add a README file"
   - ❌ 不要勾选 ".gitignore"
   - ❌ 不要勾选 "Choose a license"
3. 点击 **Create repository**

### 3. 关联并推送代码

GitHub 会显示推送命令，执行：

```bash
# 关联远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/nfc-video-manager.git

# 推送代码
git push -u origin main
```

---

## ✅ 第二步：在 Vercel 部署

### 1. 登录 Vercel

1. 访问 https://vercel.com
2. 点击 **Continue with GitHub**
3. 授权 Vercel 访问你的 GitHub

### 2. 导入项目

1. 点击 **Add New...** → **Project**
2. 在 **Import Git Repository** 页面找到你的 `nfc-video-manager` 仓库
3. 点击 **Import**

### 3. 配置项目

在 **Configure Project** 页面：

- **Framework Preset**: 选择 `Other`
- **Root Directory**: 保持 `./`
- **Build Command**: 留空（不需要构建）
- **Output Directory**: 留空（使用 `public` 文件夹）
- **Install Command**: 保持 `npm install`

### 4. 添加环境变量

点击 **Environment Variables**，添加以下变量：

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://nmlcpisjdfzfnudsedrf.supabase.co` |
| `SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tbGNwaXNqZGZ6Zm51ZHNlZHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyODg2MDYsImV4cCI6MjA5MTg2NDYwNn0.ALsUca0EqpCMFh-24-15VJXGb4eg8kUm0VefVRVv_Bs` |
| `BASE_URL` | （部署后会自动生成，先留空） |

### 5. 部署

点击 **Deploy**，等待部署完成（约 1-2 分钟）

---

## ✅ 第三步：获取部署域名并更新配置

### 1. 获取 Vercel 域名

部署完成后，你会看到：
- **Congratulations!** 页面
- 域名类似：`https://nfc-video-manager-xxx.vercel.app`

复制这个域名！

### 2. 更新环境变量

1. 在 Vercel 项目页面，点击 **Settings** → **Environment Variables**
2. 编辑 `BASE_URL`，填入你的 Vercel 域名：
   ```
   BASE_URL=https://nfc-video-manager-xxx.vercel.app
   ```
3. 点击 **Save**

### 3. 重新部署

1. 点击 **Deployments** 标签
2. 找到最新的部署，点击 **...** → **Redeploy**
3. 等待重新部署完成

---

## ✅ 第四步：测试

### 1. 访问管理后台

```
https://你的域名.vercel.app/admin.html
```

### 2. 上传新视频

上传视频后，系统会生成类似这样的 NFC 链接：
```
https://你的域名.vercel.app/v/abc123
```

### 3. 在其他设备测试

用手机或其他电脑访问这个 NFC 链接，应该可以正常播放视频了！

---

## 🔧 常见问题

### Q: 部署失败怎么办？
A: 查看 Vercel 的 **Functions** 日志，检查错误信息

### Q: 视频上传失败？
A: 检查 Supabase Storage 策略是否正确配置

### Q: 如何绑定自定义域名？
A: 在 Vercel Settings → Domains 中添加你的域名

### Q: 如何更新代码？
A: 本地修改后 `git push`，Vercel 会自动重新部署

---

## 📱 最终效果

```
用户手机 NFC → https://你的域名.vercel.app/v/abc123
              → 自动跳转到 Supabase 视频链接
              → 无感播放视频
```

**开始部署吧！** 有任何问题随时告诉我。

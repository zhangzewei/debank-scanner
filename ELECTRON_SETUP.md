# DeFi Scanner Electron 应用设置指南

本指南将帮助你将DeFi Scanner从Web应用转换为Mac桌面应用。

## 🚀 快速开始

### 1. 安装依赖

首先安装所需的Electron依赖：

```bash
npm install
```

### 2. 开发模式

在开发模式下运行Electron应用：

```bash
# 启动开发模式（同时运行Next.js dev服务器和Electron）
npm run electron-dev
```

这将：
- 启动Next.js开发服务器在 `http://localhost:3000`
- 等待服务器就绪后启动Electron窗口
- 自动打开开发者工具

### 3. 生产模式

构建并运行生产版本：

```bash
# 构建Next.js应用并运行Electron
npm run build-electron
```

### 4. 打包为Mac应用

创建Mac安装包：

```bash
# 构建Mac应用（.dmg文件）
npm run build-mac
```

生成的文件将位于 `dist/` 目录中。

## 📦 可用脚本

- `npm run electron` - 运行Electron（需要先构建）
- `npm run electron-dev` - 开发模式
- `npm run build-electron` - 构建并运行
- `npm run dist` - 创建分发包
- `npm run build-mac` - 专门为Mac创建.dmg安装包

## 🔧 配置

### 环境变量

确保设置了必要的环境变量：

```bash
# .env.local
DEBANK_ADDRESSES=0x...,0x...  # 要监控的钱包地址，用逗号分隔
SCRAPE_DELAY=2000             # 爬取间隔（毫秒）
SCRAPE_TIMEOUT=30000          # 爬取超时（毫秒）
```

### 应用配置

在 `package.json` 中的 `build` 配置部分可以自定义：

- 应用ID和名称
- 图标和资源
- 目标平台
- 输出目录

## 🖥️ 系统要求

### macOS
- macOS 10.14 或更高版本
- 支持 Intel (x64) 和 Apple Silicon (arm64)

### 开发环境
- Node.js 18+ 
- npm 或 yarn
- Git

## 🔒 安全特性

- **上下文隔离**: 渲染进程和主进程完全隔离
- **禁用Node集成**: 渲染进程无法直接访问Node.js API
- **preload脚本**: 安全地暴露必要的API
- **内容安全策略**: 防止恶意代码执行

## 🚨 故障排除

### 常见问题

1. **"ts-node not found" 错误**
   ```bash
   npm install ts-node --save-dev
   ```

2. **Playwright浏览器未安装**
   ```bash
   npx playwright install chromium
   ```

3. **权限错误（macOS）**
   - 在"系统偏好设置" > "安全性与隐私"中允许应用运行
   - 可能需要在"辅助功能"中授予权限

4. **构建失败**
   ```bash
   # 清理并重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

### 开发提示

- 使用 `Cmd+Option+I` 打开开发者工具
- 应用日志会显示在终端中
- 修改代码后需要重启Electron（开发模式下）

## 📱 应用功能

在Electron版本中，所有Web版本的功能都可用：

- ✅ DeFi资产数据爬取
- ✅ 多钱包监控
- ✅ 数据可视化图表
- ✅ 历史数据比较
- ✅ 定时任务
- ✅ 离线数据存储

## 🔄 API适配

Electron版本使用IPC（进程间通信）替代HTTP API：

- Web版本: `fetch('/api/debank/scrape')`
- Electron版本: `window.electronAPI.scrapeDeBank()`

这个转换由 `src/lib/electron-api.ts` 自动处理。

## 📋 部署检查清单

发布前确保：

- [ ] 所有依赖已安装
- [ ] 环境变量已设置
- [ ] 应用在开发模式下正常运行
- [ ] 生产构建成功
- [ ] Mac打包成功生成.dmg文件
- [ ] 在目标Mac系统上测试安装和运行

## 🆘 获取帮助

如果遇到问题：

1. 检查终端输出的错误信息
2. 查看Electron开发者工具的控制台
3. 确认所有依赖版本兼容
4. 参考 [Electron官方文档](https://www.electronjs.org/docs/latest/)

---

🎉 现在你的DeFi Scanner已经成功转换为Mac桌面应用！ 
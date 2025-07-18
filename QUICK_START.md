# DeFi Scanner Mac应用 - 快速开始

你的DeFi Scanner已经成功转换为Mac桌面应用！🎉

## 📱 安装应用

在 `dist/` 目录中，你会找到以下最新安装包：

- **Intel Mac (x64)**: `DeFi Scanner-0.1.0.dmg` (189MB)
- **Apple Silicon Mac (ARM64)**: `DeFi Scanner-0.1.0-arm64.dmg` (185MB)

**✅ 最新版本特性**：
- 完全离线数据爬取功能 
- 实时DeFi资产监控
- 原生Mac应用体验
- 内置数据可视化图表
- 🔧 **已修复数据存储问题** - 使用Mac标准用户数据目录

### 安装步骤

1. 双击对应你Mac架构的 `.dmg` 文件
2. 将 "DeFi Scanner" 拖拽到 "Applications" 文件夹
3. 在Launchpad或Applications文件夹中启动应用

### 首次运行

由于应用未签名，macOS可能会显示安全警告：

1. 如果看到"无法打开应用"的提示：
   - 打开 "系统偏好设置" > "安全性与隐私"
   - 点击 "仍要打开" 按钮

2. 或者在终端中执行（替换为实际路径）：
   ```bash
   sudo xattr -rd com.apple.quarantine /Applications/DeFi\ Scanner.app
   ```

## 🚀 使用应用

### 环境配置

在应用数据目录创建 `.env.local` 文件：

```bash
# Mac应用的配置文件位置：
~/Library/Application Support/debank-scanner/.env.local
```

添加配置：
```bash
DEBANK_ADDRESSES=0x...,0x...  # 要监控的钱包地址
SCRAPE_DELAY=2000             # 爬取间隔（毫秒）
SCRAPE_TIMEOUT=30000          # 爬取超时（毫秒）
```

### 主要功能

✅ **数据爬取**: 点击"开始爬取"按钮获取DeBank数据  
✅ **实时监控**: 查看钱包资产变化  
✅ **数据可视化**: 图表显示资产分布  
✅ **历史比较**: 对比不同时间点的数据  
✅ **离线存储**: 数据本地保存，无需网络即可查看历史数据  

### 菜单功能

- **DeFi Scanner** > 关于: 查看应用信息
- **查看** > 开发者工具: 调试和查看日志
- **查看** > 重新加载: 刷新应用

## 🛠 开发者信息

### 项目结构
```
debank-scanner/
├── main.js              # Electron主进程
├── preload.js           # 安全的IPC接口
├── electron-adapter.js  # TypeScript适配器
├── out/                 # Next.js静态文件
├── dist/                # 构建输出
└── src/                 # 源代码
```

### 重新构建

如果需要修改并重新构建：

```bash
# 开发模式
npm run electron-dev

# 构建新的安装包
npm run build-mac
```

### 数据存储

应用数据存储在：
- **macOS**: `~/Library/Application Support/debank-scanner/`
- **爬取数据**: `~/Library/Application Support/debank-scanner/data/`
- **日志**: 在应用的开发者工具中查看

### 验证安装

**🔍 推荐：使用自动验证脚本**

运行增强的验证脚本，自动检测并修复常见问题：
```bash
./verify-app.sh
```

该脚本会自动：
- ✅ 检查应用安装状态
- ✅ 创建所需的数据目录
- ✅ 验证Playwright环境
- ✅ 检测浏览器版本不匹配问题
- 🔧 提供自动修复选项

**手动验证**：
```bash
# 检查数据目录
ls -la ~/Library/Application\ Support/debank-scanner/data/

# 检查Playwright安装
npx playwright --version
npx playwright list

# 测试应用启动
/Applications/DeFi\ Scanner.app/Contents/MacOS/DeFi\ Scanner
```

## 🔧 故障排除

### 常见安装问题

1. **数据目录未创建错误**
   
   **现象**: 遇到 "ENOENT: no such file or directory, mkdir '/data'" 错误
   
   **解决方案**:
   ```bash
   # 手动创建数据目录
   mkdir -p ~/Library/Application\ Support/debank-scanner/data
   
   # 确保权限正确
   chmod 755 ~/Library/Application\ Support/debank-scanner/data
   ```

2. **Playwright浏览器版本不匹配**
   
   **现象**: 错误信息类似 "chromium_headless_shell-1179 not found" 但实际安装的是 "chromium_headless_shell-1180"
   
   **解决方案 (推荐)**:
   ```bash
   # 重新安装Playwright浏览器
   npx playwright uninstall --all
   npx playwright install chromium
   ```
   
   **备用解决方案**:
   ```bash
   # 手动创建符号链接（将1180替换为实际版本）
   cd ~/Library/Caches/ms-playwright
   ln -s chromium_headless_shell-1180 chromium_headless_shell-1179
   ```

3. **应用无法启动**
   - 检查macOS版本是否为10.14+
   - 尝试从终端启动查看错误信息
   ```bash
   /Applications/DeFi\ Scanner.app/Contents/MacOS/DeFi\ Scanner
   ```

4. **数据爬取失败**
   - 确保网络连接正常
   - 检查DeBank网站是否可访问
   - 在开发者工具中查看详细错误
   - 验证Playwright安装：`npx playwright --version`

5. **权限问题**
   - 在"系统偏好设置" > "安全性与隐私" > "辅助功能"中添加应用

### 性能优化

- 调整 `SCRAPE_DELAY` 来平衡速度和稳定性
- 定期清理旧的数据文件
- 在"查看"菜单中重新加载应用以释放内存

## 📞 获取帮助

- 查看 `ELECTRON_SETUP.md` 了解详细技术信息
- 在开发者工具的控制台中查看错误日志
- 检查应用数据目录中的日志文件

---

🎊 享受你的DeFi Scanner Mac应用！ 
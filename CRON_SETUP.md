# 本地 Web 爬虫与数据对比系统

## 概述

这个项目配置了一个使用 Playwright 进行网页爬取的系统，可以在本地服务器上运行。系统会爬取指定网站的数据，并提供数据对比功能。

## 功能特性

- 🕷️ **网页爬取**: 使用 Playwright 爬取网页数据
- 📊 **数据对比**: 自动比较本次和上次爬取的数据差异
- 💾 **数据存储**: 将数据保存为 JSON 文件在本地
- 🎯 **智能差异**: 识别新增、删除、修改的内容
- 📱 **可视化界面**: 友好的 Web 界面展示数据和差异

## 文件结构

```
src/
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── route.ts          # 爬虫 API 路由（Playwright 爬取）
│   │   └── data/
│   │       └── route.ts          # 数据获取 API
│   └── cron/
│       └── page.tsx              # 数据对比和管理页面
data/                             # 数据存储目录
├── current.json                  # 当前爬取数据
└── previous.json                 # 上一次爬取数据
```

## 配置步骤

### 1. 安装依赖

```bash
npm install
npx playwright install
```

### 2. 设置环境变量

创建 `.env.local` 文件并添加以下环境变量：

- `CRON_SECRET`: 用于验证 API 请求的密钥
- `SCRAPE_URL`: 要爬取的目标网站 URL
- `NEXT_PUBLIC_SCRAPE_URL`: 前端显示用的目标网站 URL

例如：
```
CRON_SECRET=your-secret-key-123
SCRAPE_URL=https://example.com/products
NEXT_PUBLIC_SCRAPE_URL=https://example.com/products
```

### 3. 修改爬取逻辑

编辑 `src/app/api/cron/route.ts` 中的 `scrapeWebData` 函数：

```typescript
async function scrapeWebData() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const targetUrl = process.env.SCRAPE_URL || 'https://example.com';
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    
    // 自定义您的爬取逻辑
    const data = await page.evaluate(() => {
      // 示例：爬取特定元素
      const items = Array.from(document.querySelectorAll('.item')).map(item => ({
        title: item.querySelector('h2')?.textContent?.trim() || '',
        price: item.querySelector('.price')?.textContent?.trim() || '',
        link: item.querySelector('a')?.href || '',
        timestamp: new Date().toISOString()
      }));
      
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        items: items,
        scrapedAt: new Date().toISOString()
      };
    });
    
    await context.close();
    return data;
  } finally {
    await browser.close();
  }
}
```

### 4. 自定义数据对比逻辑

根据您的数据结构，修改 `calculateDiff` 函数：

```typescript
function calculateDiff(previous: any, current: any) {
  // 根据您的数据结构自定义比较逻辑
  const prevItems = previous.items || [];
  const currItems = current.items || [];
  
  // 比较逻辑...
}
```

## 数据对比功能

系统会自动比较以下内容：

1. **新增内容**: 本次爬取中新出现的项目
2. **删除内容**: 上次存在但本次消失的项目
3. **修改内容**: 相同 URL 但内容发生变化的项目
4. **标题变化**: 页面标题是否发生变化
5. **描述变化**: 页面描述是否发生变化

## 使用指南

### 本地开发

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问 `http://localhost:3000/cron` 来：
   - 手动触发爬取
   - 查看数据对比
   - 管理爬取任务

## 页面功能说明

### 控制面板
- **手动触发爬取**: 立即执行一次爬取任务
- **刷新数据**: 重新加载已保存的数据

### 数据变化分析
- **统计概览**: 显示数据数量变化
- **变化详情**: 按类型显示具体变化内容
- **颜色标识**: 绿色（新增）、红色（删除）、黄色（修改）

### 数据详情
- **当前数据**: 最新一次爬取的数据
- **历史数据**: 上一次爬取的数据
- **时间戳**: 记录每次爬取的时间

## 高级配置

### 自定义爬取策略

```typescript
// 等待特定元素加载
await page.waitForSelector('.content');

// 模拟用户交互
await page.click('.load-more');
await page.waitForTimeout(2000);

// 处理动态内容
await page.waitForFunction(() => {
  return document.querySelectorAll('.item').length > 0;
});
```

### 错误处理

```typescript
try {
  await page.goto(targetUrl, { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
} catch (error) {
  console.error('Page load failed:', error);
  // 实现重试逻辑
}
```

## 定时任务配置

如果需要定时运行爬虫，可以使用系统的 cron 或其他调度工具：

### Linux/Mac 系统 cron

1. 编辑 crontab：
   ```bash
   crontab -e
   ```

2. 添加定时任务（例如每天午夜运行）：
   ```
   0 0 * * * curl -X GET -H "Authorization: Bearer your-secret-key" http://localhost:3000/api/cron
   ```

### Windows 任务计划程序

1. 创建一个 `.bat` 文件：
   ```bat
   curl -X GET -H "Authorization: Bearer your-secret-key" http://localhost:3000/api/cron
   ```

2. 使用 Windows 任务计划程序设置定时运行该脚本

## 安全注意事项

1. 使用 `CRON_SECRET` 保护 API 端点
2. 遵守目标网站的 robots.txt 规则
3. 设置合理的爬取频率，避免对目标网站造成压力
4. 不要爬取敏感信息或侵犯版权

## 故障排除

1. **Playwright 启动失败**: 检查是否已安装浏览器 `npx playwright install`
2. **数据对比异常**: 检查数据结构是否一致
3. **文件读写错误**: 检查文件权限和路径
4. **网络超时**: 调整超时设置或重试逻辑

## 扩展功能

- **数据库集成**: 使用 PostgreSQL 或 MongoDB 存储数据
- **通知系统**: 发送邮件或 Slack 通知
- **API 集成**: 将数据推送到其他系统
- **图表展示**: 添加数据可视化图表
- **历史记录**: 保存更长时间的历史数据 
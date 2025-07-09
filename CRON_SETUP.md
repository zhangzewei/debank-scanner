# Vercel Cron Job with Playwright 网页爬取配置说明

## 概述

这个项目配置了一个使用 Playwright 进行网页爬取的 cron job，可以在 Vercel 上自动运行。系统会定期爬取指定网站的数据，并提供数据对比功能。

## 功能特性

- 🕷️ **自动网页爬取**: 使用 Playwright 爬取网页数据
- 📊 **数据对比**: 自动比较本次和上次爬取的数据差异
- 💾 **数据存储**: 将数据保存为 JSON 文件在服务器上
- 🎯 **智能差异**: 识别新增、删除、修改的内容
- 🔄 **定时执行**: 支持 cron 表达式定时运行
- 📱 **可视化界面**: 友好的 Web 界面展示数据和差异

## 文件结构

```
src/
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── route.ts          # Cron job API 路由（Playwright 爬取）
│   │   └── data/
│   │       └── route.ts          # 数据获取 API
│   └── cron/
│       └── page.tsx              # 数据对比和管理页面
data/                             # 数据存储目录
├── current.json                  # 当前爬取数据
└── previous.json                 # 上一次爬取数据
vercel.json                       # Vercel 配置文件
```

## 配置步骤

### 1. 安装依赖

```bash
npm install playwright
```

### 2. 设置环境变量

在 Vercel 项目设置中添加以下环境变量：

- `CRON_SECRET`: 用于验证 cron job 请求的密钥
- `SCRAPE_URL`: 要爬取的目标网站 URL
- `NEXT_PUBLIC_SCRAPE_URL`: 前端显示用的目标网站 URL

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

## 常用 Cron 表达式

| 表达式 | 说明 |
|--------|------|
| `0 */6 * * *` | 每 6 小时运行一次 |
| `0 0 * * *` | 每天午夜运行 |
| `0 */2 * * *` | 每 2 小时运行一次 |
| `0 0 * * 1` | 每周一午夜运行 |
| `0 0 1 * *` | 每月 1 号午夜运行 |
| `*/30 * * * *` | 每 30 分钟运行一次 |

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

### 部署到 Vercel

1. 推送代码到 Git 仓库
2. 在 Vercel 中连接仓库
3. 配置环境变量
4. 部署完成后访问 `/cron` 页面

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

## 监控和日志

- 在 Vercel 仪表板中查看 Function 日志
- 在 `/cron` 页面查看执行结果和数据变化
- 可以添加外部监控服务（如 Sentry）

## 性能优化

1. **选择性爬取**: 只爬取必要的数据
2. **缓存策略**: 利用 Vercel 的缓存机制
3. **数据分页**: 对大量数据进行分批处理
4. **超时设置**: 设置合理的超时时间

## 安全注意事项

1. 使用 `CRON_SECRET` 保护 API 端点
2. 遵守目标网站的 robots.txt 规则
3. 设置合理的爬取频率，避免对目标网站造成压力
4. 不要爬取敏感信息或侵犯版权

## 限制

- Vercel 函数执行时间限制（通常为 10 秒）
- 内存使用限制
- 存储空间限制（使用文件系统存储）
- 网络请求限制

## 故障排除

1. **Playwright 启动失败**: 检查 Vercel 部署日志
2. **数据对比异常**: 检查数据结构是否一致
3. **文件读写错误**: 检查文件权限和路径
4. **网络超时**: 调整超时设置或重试逻辑

## 扩展功能

- **数据库集成**: 使用 PostgreSQL 或 MongoDB 存储数据
- **通知系统**: 发送邮件或 Slack 通知
- **API 集成**: 将数据推送到其他系统
- **图表展示**: 添加数据可视化图表
- **历史记录**: 保存更长时间的历史数据

## 示例配置

### 环境变量示例

```env
CRON_SECRET=your-secret-key-123
SCRAPE_URL=https://example.com/products
NEXT_PUBLIC_SCRAPE_URL=https://example.com/products
```

### vercel.json 配置

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 */6 * * *"
    }
  ]
}
``` 
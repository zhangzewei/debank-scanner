# 快速上手指南

## 🚀 5 分钟快速启动

### 1. 安装依赖

```bash
npm install
npx playwright install
```

### 2. 本地运行

1. 创建 `.env.local` 文件并设置环境变量：
   ```
   CRON_SECRET=your-secret-key-123
   SCRAPE_URL=https://example.com
   NEXT_PUBLIC_SCRAPE_URL=https://example.com
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 打开浏览器访问：`http://localhost:3000/cron`

4. 点击"手动触发爬取"按钮进行测试

### 3. 自定义爬取内容

修改 `src/app/api/cron/route.ts` 中的爬取逻辑：

```typescript
// 在 page.evaluate() 中修改您的爬取逻辑
const data = await page.evaluate(() => {
  // 示例：爬取产品信息
  const products = Array.from(document.querySelectorAll('.product')).map(product => ({
    name: product.querySelector('h3')?.textContent?.trim() || '',
    price: product.querySelector('.price')?.textContent?.trim() || '',
    link: product.querySelector('a')?.href || '',
    image: product.querySelector('img')?.src || ''
  }));
  
  return {
    title: document.title,
    products: products,
    scrapedAt: new Date().toISOString()
  };
});
```

### 4. 修改数据对比逻辑

根据您的数据结构，修改 `calculateDiff` 函数：

```typescript
function calculateDiff(previous: any, current: any) {
  const prevProducts = previous.products || [];
  const currProducts = current.products || [];
  
  // 找新增的产品
  const newProducts = currProducts.filter(curr => 
    !prevProducts.some(prev => prev.link === curr.link)
  );
  
  // 找删除的产品
  const removedProducts = prevProducts.filter(prev => 
    !currProducts.some(curr => curr.link === prev.link)
  );
  
  // 找价格变化的产品
  const priceChanges = currProducts.filter(curr => {
    const prevProduct = prevProducts.find(prev => prev.link === curr.link);
    return prevProduct && prevProduct.price !== curr.price;
  });
  
  return {
    type: 'comparison',
    summary: {
      previousCount: prevProducts.length,
      currentCount: currProducts.length,
      newCount: newProducts.length,
      removedCount: removedProducts.length,
      priceChangeCount: priceChanges.length
    },
    changes: {
      new: newProducts,
      removed: removedProducts,
      priceChanges: priceChanges
    }
  };
}
```

## 🔧 常见问题

### Q: 如何设置定时运行？
A: 使用系统的 cron 或任务计划程序：

**Linux/Mac**:
```bash
crontab -e
# 添加以下内容（每天午夜运行）
0 0 * * * curl -X GET -H "Authorization: Bearer your-secret-key" http://localhost:3000/api/cron
```

**Windows**:
创建一个批处理文件并使用任务计划程序定时运行。

### Q: 如何处理需要登录的网站？
A: 在爬取前添加登录逻辑：
```typescript
// 登录流程
await page.goto('https://example.com/login');
await page.fill('input[name="username"]', 'your-username');
await page.fill('input[name="password"]', 'your-password');
await page.click('button[type="submit"]');
await page.waitForNavigation();

// 然后进行爬取
await page.goto(targetUrl);
```

### Q: 如何处理动态加载的内容？
A: 等待内容加载完成：
```typescript
// 等待特定元素出现
await page.waitForSelector('.product-list');

// 或者等待网络请求完成
await page.waitForLoadState('networkidle');

// 或者等待特定条件
await page.waitForFunction(() => {
  return document.querySelectorAll('.product').length > 0;
});
```

### Q: 如何处理分页数据？
A: 循环处理多页：
```typescript
let allData = [];
let pageNum = 1;

while (true) {
  const data = await page.evaluate(() => {
    // 爬取当前页数据
    return Array.from(document.querySelectorAll('.item')).map(item => ({
      // 数据提取逻辑
    }));
  });
  
  if (data.length === 0) break;
  
  allData = [...allData, ...data];
  
  // 点击下一页
  const nextButton = await page.$('.next-page');
  if (!nextButton) break;
  
  await nextButton.click();
  await page.waitForTimeout(2000);
  pageNum++;
}
```

## 📊 数据格式示例

推荐的数据结构：

```typescript
interface ScrapedData {
  title: string;           // 页面标题
  description: string;     // 页面描述
  items: Array<{          // 爬取的项目列表
    id: string;           // 唯一标识
    title: string;        // 项目标题
    url: string;          // 项目链接
    price?: string;       // 价格（可选）
    image?: string;       // 图片（可选）
    category?: string;    // 分类（可选）
    timestamp: string;    // 时间戳
  }>;
  scrapedAt: string;      // 爬取时间
}
```

## 🎯 最佳实践

1. **遵守网站规则**: 检查 robots.txt 和使用条款
2. **设置合理延迟**: 避免对服务器造成过大压力
3. **错误处理**: 始终包含 try-catch 块
4. **数据验证**: 验证爬取的数据格式
5. **监控日志**: 定期检查日志

## 📚 更多资源

- [Playwright 官方文档](https://playwright.dev/)
- [完整配置说明](./CRON_SETUP.md)

祝您使用愉快！🎉 
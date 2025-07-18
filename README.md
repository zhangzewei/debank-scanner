# DeBank Portfolio Scanner

A comprehensive web scraping system for monitoring DeBank portfolio data across multiple wallet addresses. This system provides real-time portfolio tracking, data comparison, and visual analytics using modern web technologies.

## Features

🔍 **Multi-Address Scraping**: Monitors 9 different wallet addresses simultaneously
📊 **Interactive Dashboard**: Beautiful web interface with ECharts visualization
📈 **Portfolio Analytics**: Pie charts showing asset distribution across addresses
💰 **Real-time Data**: Live portfolio values and project breakdowns
📱 **Responsive Design**: Works on desktop and mobile devices
🔄 **Automated Comparison**: Tracks changes between scraping sessions
⚡ **Fast Performance**: Efficient Playwright-based scraping
🎯 **Project-level Detail**: Detailed breakdown of DeFi positions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   npx playwright install
   ```

2. **Configure Environment Variables**
   ```bash
   # Copy the example file to create your local config
   cp .env.example .env.local
   
   # Edit .env.local to customize your wallet addresses
   # DEBANK_ADDRESSES=0xYourAddress1,0xYourAddress2,0xYourAddress3
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Dashboard**
   Open http://localhost:3000 in your browser

5. **Run Your First Scrape**
   Click the "刷新数据" (Refresh Data) button to start scraping

## 故障排除 (Troubleshooting)

### 常见安装问题

#### 1. 数据目录未创建问题
如果在运行应用时遇到 "ENOENT: no such file or directory, mkdir '/data'" 错误，需要手动创建数据目录：

**Mac/Linux用户：**
```bash
# 在项目根目录下创建data文件夹
mkdir -p data

# 或者在用户数据目录创建
mkdir -p ~/Library/Application\ Support/debank-scanner/data
```

**检查数据目录权限：**
```bash
# 确保目录有写入权限
chmod 755 data
ls -la data
```

#### 2. Playwright浏览器版本不匹配问题
如果遇到类似 "chromium_headless_shell-1179 not found" 但实际安装的是 "chromium_headless_shell-1180" 的错误：

**解决方案1 - 重新安装Playwright (推荐)：**
```bash
# 完全清理并重新安装Playwright
npx playwright uninstall --all
npx playwright install chromium
```

**解决方案2 - 手动创建符号链接：**
```bash
# 找到实际的浏览器安装目录
find ~/Library/Caches/ms-playwright -name "chromium*" -type d

# 创建符号链接（将实际版本号替换为程序需要的版本号）
cd ~/Library/Caches/ms-playwright
ln -s chromium_headless_shell-1180 chromium_headless_shell-1179
```

**解决方案3 - 强制重新下载：**
```bash
# 强制重新下载浏览器
npx playwright install --force chromium
```

**验证安装：**
```bash
# 检查浏览器是否正确安装
npx playwright --version
npx playwright list
```

#### 3. 其他常见问题

**内存不足错误：**
```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

**端口占用问题：**
```bash
# 检查端口占用
lsof -i :3000
# 或使用其他端口
npm run dev -- -p 3001
```

**权限问题：**
```bash
# Mac用户可能需要授予应用网络访问权限
# 系统偏好设置 > 安全性与隐私 > 隐私 > 完全磁盘访问权限
```

## API Endpoints

### Scrape Data
```bash
# Start scraping all addresses
curl -X POST http://localhost:3000/api/debank/scrape
```

### Get Latest Data
```bash
# Retrieve the latest scraped data
curl http://localhost:3000/api/debank/data
```

### Cron Job
```bash
# Automated scraping endpoint
curl http://localhost:3000/api/cron
```

## Monitored Addresses

The system monitors these 9 wallet addresses:

- 0xd100b6645eb05bd88ff6491cb9f1c2688948b838 (Primary - $1,271,339)
- 0x0f2876396a71fe09a175d97f83744377be9b6363 ($55,579)
- 0x966969b95b76e97f09dc84ce6987b45bf34993b6 ($87,138)
- 0x818bbe45b55c1a933f55dc9eb36b2a899586367e ($519,843)
- 0xfa6e9a3432822833c38db67116f445d97efba894 ($67,474)
- 0x368dd33f71552cac1524d6d79f3aa8d85d3cdc1d ($43,578)
- 0x54932f94b8041d999fd6e20b09a6c406b7959636 ($50,192)
- 0x318d9d9200e4049e0c439eb361486d70e0124237 ($71,951)
- 0x36a9edd2b2b39b5278b241bd61e887bef885dea3 ($23,779)

**Total Portfolio Value: $2,190,873**

## Dashboard Features

### Overview Cards
- **Total Portfolio Value**: Real-time aggregated value across all addresses
- **Last Updated**: Timestamp of the most recent scraping session
- **Individual Address Cards**: Detailed breakdown per wallet

### Pie Chart Visualization
- Interactive pie chart showing asset distribution
- Hover tooltips with full address and percentage
- Responsive design for all screen sizes

### Address Details
Each address card shows:
- **Wallet Balance**: Direct wallet holdings
- **Project Investments**: DeFi positions by protocol
- **Total Value**: Combined wallet + project value
- **Full Address**: Complete wallet address for reference

## Data Structure

The system tracks the following data for each address:

```typescript
interface AddressData {
  address: string;
  totalBalance: string;          // e.g., "$1,271,339"
  totalBalanceUSD: number;       // 1271339
  wallet: {
    amount: string;
    amountUSD: number;
  } | null;
  projects: Array<{
    name: string;                // e.g., "Equilibria", "Stake DAO"
    amount: string;
    amountUSD: number;
  }>;
  scrapedAt: string;             // ISO timestamp
}
```

## File Structure

```
debank-scanner/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cron/route.ts          # Automated scraping
│   │   │   └── debank/
│   │   │       ├── scrape/route.ts    # Manual scraping
│   │   │       └── data/route.ts      # Data retrieval
│   │   └── page.tsx                   # Dashboard UI
│   ├── lib/
│   │   └── debank-scraper.ts          # Core scraping logic
│   └── types/
│       └── scraped-data.ts            # TypeScript definitions
├── data/                              # Scraped data storage
│   ├── debank-latest.json            # Latest data
│   └── debank-data-[timestamp].json  # Historical data
└── test-scraper.ts                    # Test script
```

## DeFi Projects Tracked

The system automatically detects and tracks positions in various DeFi protocols:

- **Equilibria**: Yield farming and liquidity provision
- **Stake DAO**: Staking and governance tokens
- **Venus**: Lending and borrowing protocol
- **Aave V3**: Decentralized lending platform
- **Curve**: Automated market maker for stablecoins
- **Convex**: Curve yield optimization
- **Euler**: Permissionless lending protocol
- **Lombard**: Bitcoin liquid staking
- **SatLayer**: Bitcoin staking solutions
- **Solv**: Structured products for Bitcoin
- **CIAN**: Yield farming automation
- **StakeStone**: Ethereum liquid staking
- **ZeroLend**: Decentralized lending
- **SushiSwap V3**: AMM and DEX
- **Pendle V2**: Yield tokenization
- **Magpie XYZ**: Yield optimization
- **GMX V2**: Decentralized perpetual exchange
- **ether.fi**: Ethereum liquid staking
- **Kinetic Market**: Trading and liquidity
- **flare**: Smart contract platform
- **Trevee**: DeFi infrastructure

## Technical Architecture

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **ECharts**: Interactive data visualization
- **Responsive Design**: Mobile-first approach

### Backend
- **Playwright**: Web scraping automation
- **Node.js**: Server-side runtime
- **File System**: JSON-based data storage
- **REST API**: Standard HTTP endpoints

### Scraping Strategy
1. **Headless Browser**: Playwright with Chromium
2. **Smart Selectors**: CSS selectors for dynamic content
3. **Wait Strategies**: Ensures complete page loading
4. **Error Handling**: Graceful fallbacks for failed scrapes
5. **Rate Limiting**: Delays between requests to avoid blocking

## Automation & Monitoring

### Cron Jobs
The system supports automated scraping via cron jobs. See `CRON_SETUP.md` for configuration details.

### Data Comparison
Every scrape compares against the previous data to calculate:
- Portfolio value changes
- Individual address changes
- Project-level changes
- Percentage changes

### Error Handling
- Graceful degradation for failed scrapes
- Detailed error logging
- Retry mechanisms for transient failures
- Fallback data display

## Environment Variables

The system uses environment variables for configuration. Copy `.env.example` to `.env.local` and customize:

```bash
# Required: DeBank wallet addresses (comma-separated)
DEBANK_ADDRESSES=0xd100b6645eb05bd88ff6491cb9f1c2688948b838,0x0f2876396a71fe09a175d97f83744377be9b6363

# Optional: Scraping configuration
SCRAPE_DELAY=2000          # Delay between requests (milliseconds)
SCRAPE_TIMEOUT=30000       # Timeout for page loading (milliseconds)
```

### Configuration Benefits

- **Flexibility**: Change addresses without modifying code
- **Security**: Keep sensitive data out of the codebase
- **Scalability**: Easy to add/remove addresses
- **Customization**: Adjust scraping behavior for different environments
- **Environment-specific**: Use different address sets for development/production

## Development

### Testing
```bash
# Test environment variables configuration
node test-env.js

# Run the test scraper
npm run test-scraper

# Test individual components
npm run test
```

### Adding New Addresses
Edit the `DEBANK_ADDRESSES` environment variable in your `.env.local` file:

```bash
# Add your new addresses to the comma-separated list
DEBANK_ADDRESSES=0xd100b6645eb05bd88ff6491cb9f1c2688948b838,0x[your-new-address],0x[another-address]
```

You can also customize scraping behavior:

```bash
# Set delay between requests (milliseconds)
SCRAPE_DELAY=2000

# Set timeout for page loading (milliseconds)
SCRAPE_TIMEOUT=30000
```

### Customizing Scraping
The scraper uses CSS selectors to extract data from DeBank:
- `[class*="Portfolio_defiItem"]`: Main portfolio container
- `[class*="TokenWallet_container"]`: Wallet section
- `[class*="Project_project"]`: Individual projects
- `[class*="ProjectTitle_name"]`: Project names
- `[class*="HeaderInfo_curveEnable"]`: Total balance

## Performance

- **Scraping Speed**: ~2-3 minutes for all 9 addresses
- **Data Size**: ~7KB per scraping session
- **Memory Usage**: Minimal (< 100MB during scraping)
- **API Response**: < 100ms for data retrieval

## Security

- **Headless Mode**: No GUI for production security
- **Rate Limiting**: Prevents IP blocking
- **Error Isolation**: Failed scrapes don't affect other addresses
- **Data Validation**: Input sanitization and type checking

## Deployment

### Local Development
1. Clone the repository
2. Install dependencies with `npm install`
3. Install Playwright browsers with `npx playwright install`
4. Copy `.env.example` to `.env.local` and configure your addresses
5. Start with `npm run dev`

### Electron Desktop Application

**安装和运行：**
```bash
# 开发模式运行Electron应用
npm run electron-dev

# 构建桌面应用
npm run build-electron

# 构建Mac应用安装包
npm run build-mac
```

**Electron应用故障排除：**

1. **数据目录问题：**
   - Electron应用将数据存储在：`~/Library/Application Support/debank-scanner/data/`
   - 如果数据目录不存在，应用会自动创建
   - 如果遇到权限问题，手动创建：
     ```bash
     mkdir -p ~/Library/Application\ Support/debank-scanner/data
     chmod 755 ~/Library/Application\ Support/debank-scanner/data
     ```

2. **Playwright浏览器问题：**
   - Electron应用需要完整的Playwright环境
   - 确保运行：`npx playwright install chromium`
   - 如果遇到版本不匹配，按上述故障排除步骤处理

3. **应用启动问题：**
   ```bash
   # 清理并重新构建
   rm -rf out dist
   npm run build-electron
   
   # 检查Electron版本
   npx electron --version
   ```

### Production
1. Build the application with `npm run build`
2. Set up environment variables on your production server
3. Start the production server with `npm start`
4. Set up cron jobs for automated scraping
5. Monitor logs for scraping health

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational and personal use only. Please respect DeBank's terms of service when using this scraper.

## Support

For issues or questions:
1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Include logs and error messages when applicable

---

**Last Updated**: July 10, 2025
**Version**: 1.0.0
**Total Portfolio Value**: $2,190,873 (as of last scrape)

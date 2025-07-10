import { chromium, Browser, Page } from 'playwright';
import { AddressData, ProjectInfo, WalletInfo, DeBankData, DeBankComparison, AddressComparison } from '@/types/scraped-data';
import fs from 'fs';
import path from 'path';

// 从环境变量获取地址列表，如果没有设置则使用默认值
const getAddresses = (): string[] => {
    const envAddresses = process.env.DEBANK_ADDRESSES;

    if (envAddresses) {
        return envAddresses.split(',').map(addr => addr.trim()).filter(addr => addr.length > 0);
    }

    // 默认地址列表
    return [
        '0xd100b6645eb05bd88ff6491cb9f1c2688948b838',
        '0x0f2876396a71fe09a175d97f83744377be9b6363',
        '0x966969b95b76e97f09dc84ce6987b45bf34993b6',
        '0x818bbe45b55c1a933f55dc9eb36b2a899586367e',
        '0xfa6e9a3432822833c38db67116f445d97efba894',
        '0x368dd33f71552cac1524d6d79f3aa8d85d3cdc1d',
        '0x54932f94b8041d999fd6e20b09a6c406b7959636',
        '0x318d9d9200e4049e0c439eb361486d70e0124237',
        '0x36a9edd2b2b39b5278b241bd61e887bef885dea3'
    ];
};

// 地址列表
const ADDRESSES = getAddresses();

// 从环境变量获取配置，提供默认值
const SCRAPE_DELAY = parseInt(process.env.SCRAPE_DELAY || '2000', 10);
const SCRAPE_TIMEOUT = parseInt(process.env.SCRAPE_TIMEOUT || '30000', 10);

// 解析金额字符串为数字
function parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    const cleanStr = amountStr.replace(/[$,]/g, '');
    return parseFloat(cleanStr) || 0;
}

// 爬取单个地址数据
async function scrapeAddress(page: Page, address: string): Promise<AddressData> {
    console.log(`🔍 正在爬取地址: ${address}`);

    await page.goto(`https://debank.com/profile/${address}`, {
        waitUntil: 'networkidle'
    });

    // 等待页面加载
    await page.waitForTimeout(5000);

    // 获取总余额
    let totalBalance = '$0';
    let totalBalanceUSD = 0;

    try {
        await page.waitForSelector('[class*="HeaderInfo_curveEnable"]', { timeout: SCRAPE_TIMEOUT });
        await page.waitForFunction(() => {
            const element = document.querySelector('[class*="HeaderInfo_curveEnable"]');
            if (!element || !element.textContent) return false;
            const text = element.textContent.trim();
            return text !== '$0' && text !== '' && /\$[\d,]+/.test(text);
        }, { timeout: SCRAPE_TIMEOUT });

        const element = await page.locator('[class*="HeaderInfo_curveEnable"]').first();
        const fullBalance = await element.textContent();
        totalBalance = fullBalance?.match(/\$[\d,]+/)?.[0] || '$0';
        totalBalanceUSD = parseAmount(totalBalance);
    } catch (error) {
        console.log(`❌ 无法获取总余额: ${error}`);
    }

    // 等待Portfolio_defiItem区域加载
    await page.waitForSelector('[class*="Portfolio_defiItem"]', { timeout: SCRAPE_TIMEOUT });

    // 获取钱包信息
    let wallet: WalletInfo | null = null;
    try {
        const walletElements = await page.locator('[class*="TokenWallet_container"]').all();
        if (walletElements.length > 0) {
            const walletElement = walletElements[0];
            const walletText = await walletElement.textContent();
            const amountMatch = walletText?.match(/\$[\d,]+/);
            if (amountMatch) {
                wallet = {
                    amount: amountMatch[0],
                    amountUSD: parseAmount(amountMatch[0])
                };
            }
        }
    } catch (error) {
        console.log(`❌ 无法获取钱包信息: ${error}`);
    }

    // 获取项目信息
    const projects: ProjectInfo[] = [];
    try {
        const projectElements = await page.locator('[class*="Project_project"]').all();

        for (let i = 0; i < projectElements.length; i++) {
            const projectElement = projectElements[i];

            // 获取项目名称
            let projectName = 'Unknown';
            try {
                const nameElement = await projectElement.locator('[class*="ProjectTitle_name"]').first();
                projectName = await nameElement.textContent() || 'Unknown';
            } catch (e) {
                // 尝试其他方式获取名称
                const possibleNames = await projectElement.locator('span, div').all();
                for (const elem of possibleNames) {
                    const text = await elem.textContent();
                    if (text && text.trim() && !text.includes('$') && text.length < 20) {
                        projectName = text;
                        break;
                    }
                }
            }

            // 获取项目金额
            let projectAmount = '$0';
            const fullText = await projectElement.textContent();
            const amountMatch = fullText?.match(/\$[\d,]+/);
            if (amountMatch) {
                projectAmount = amountMatch[0];
            }

            projects.push({
                name: projectName.trim(),
                amount: projectAmount,
                amountUSD: parseAmount(projectAmount)
            });
        }
    } catch (error) {
        console.log(`❌ 无法获取项目信息: ${error}`);
    }

    console.log(`✅ 完成爬取: ${address} - 总余额: ${totalBalance}, 项目数: ${projects.length}`);

    return {
        address,
        totalBalance,
        totalBalanceUSD,
        wallet,
        projects,
        scrapedAt: new Date().toISOString()
    };
}

// 爬取所有地址数据
export async function scrapeAllAddresses(): Promise<DeBankData> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const data: DeBankData = {};

    try {
        for (const address of ADDRESSES) {
            const addressData = await scrapeAddress(page, address);
            data[address] = addressData;

            // 在请求之间添加延迟以避免被封禁
            await page.waitForTimeout(SCRAPE_DELAY);
        }
    } catch (error) {
        console.error('爬取过程中发生错误:', error);
        throw error;
    } finally {
        await browser.close();
    }

    return data;
}

// 保存数据到文件
export async function saveData(data: DeBankData): Promise<void> {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `debank-data-${timestamp}.json`;
    const filepath = path.join(dataDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    // 同时保存为最新数据
    const latestPath = path.join(dataDir, 'debank-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(data, null, 2));

    console.log(`💾 数据已保存: ${filename}`);
}

// 加载历史数据
export function loadLatestData(): DeBankData | null {
    const dataDir = path.join(process.cwd(), 'data');
    const latestPath = path.join(dataDir, 'debank-latest.json');

    if (fs.existsSync(latestPath)) {
        const data = fs.readFileSync(latestPath, 'utf-8');
        return JSON.parse(data);
    }

    return null;
}

// 比较数据变化
export function compareData(current: DeBankData, previous: DeBankData | null): DeBankComparison {
    const currentTotal = Object.values(current).reduce((sum, addr) => sum + addr.totalBalanceUSD, 0);
    const previousTotal = previous ? Object.values(previous).reduce((sum, addr) => sum + addr.totalBalanceUSD, 0) : 0;

    const totalValueChange = currentTotal - previousTotal;
    const totalValueChangePercent = previousTotal > 0 ? (totalValueChange / previousTotal) * 100 : 0;

    const addresses: AddressComparison[] = Object.values(current).map(currentAddr => {
        const previousAddr = previous?.[currentAddr.address] || null;
        const currentValue = currentAddr.totalBalanceUSD;
        const previousValue = previousAddr?.totalBalanceUSD || 0;

        const totalBalanceChange = currentValue - previousValue;
        const totalBalanceChangePercent = previousValue > 0 ? (totalBalanceChange / previousValue) * 100 : 0;

        const walletChange = (currentAddr.wallet?.amountUSD || 0) - (previousAddr?.wallet?.amountUSD || 0);

        const projectChanges = currentAddr.projects.map(currentProject => {
            const previousProject = previousAddr?.projects.find(p => p.name === currentProject.name);
            const change = currentProject.amountUSD - (previousProject?.amountUSD || 0);
            const changePercent = previousProject?.amountUSD && previousProject.amountUSD > 0
                ? (change / previousProject.amountUSD) * 100
                : 0;

            return {
                name: currentProject.name,
                change,
                changePercent
            };
        });

        return {
            address: currentAddr.address,
            current: currentAddr,
            previous: previousAddr,
            changes: {
                totalBalanceChange,
                totalBalanceChangePercent,
                walletChange,
                projectChanges
            }
        };
    });

    return {
        timestamp: new Date().toISOString(),
        totalValue: currentTotal,
        totalValueChange,
        totalValueChangePercent,
        addresses
    };
}

// 主函数：执行完整的爬取和比较流程
export async function runDeBankScraper(): Promise<DeBankComparison> {
    console.log('🚀 开始 DeBank 数据爬取...');

    // 加载历史数据
    const previousData = loadLatestData();

    // 爬取新数据
    const currentData = await scrapeAllAddresses();

    // 保存数据
    await saveData(currentData);

    // 比较数据
    const comparison = compareData(currentData, previousData);

    console.log('✅ DeBank 数据爬取完成');
    console.log(`📊 总价值: $${comparison.totalValue.toFixed(2)}`);
    if (previousData) {
        console.log(`📈 变化: ${comparison.totalValueChange >= 0 ? '+' : ''}$${comparison.totalValueChange.toFixed(2)} (${comparison.totalValueChangePercent.toFixed(2)}%)`);
    }

    return comparison;
} 
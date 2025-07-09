import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CURRENT_FILE = path.join(DATA_DIR, 'current.json');
const PREVIOUS_FILE = path.join(DATA_DIR, 'previous.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function GET(request: Request) {
    // 验证请求来源 - 支持 Vercel 自动调用和手动调用
    const authHeader = request.headers.get('authorization');
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const userAgent = request.headers.get('user-agent') || '';

    // 允许以下情况：
    // 1. Vercel 自动调用（有 x-vercel-cron header）
    // 2. User-Agent 包含 Vercel
    // 3. 正确的 Authorization header
    const isAuthorized =
        isVercelCron ||
        userAgent.includes('Vercel') ||
        authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isAuthorized) {
        console.log('Unauthorized access attempt:', {
            hasAuth: !!authHeader,
            isVercelCron,
            userAgent: userAgent.substring(0, 50)
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 记录调用来源
    const callSource = isVercelCron ? 'Vercel Cron' : 'Manual';
    console.log(`Starting web scraping at: ${new Date().toISOString()} (Source: ${callSource})`);

    try {
        // 执行网页爬取
        const scrapedData = await scrapeWebData();

        // 保存数据并获取差异
        const diff = await saveDataAndGetDiff(scrapedData);

        return NextResponse.json({
            success: true,
            message: 'Web scraping completed successfully',
            timestamp: new Date().toISOString(),
            dataCount: scrapedData?.links?.length || 0,
            diff: diff,
            source: callSource
        });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({
            error: 'Cron job failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

async function scrapeWebData() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        // 这里替换为您要爬取的网站
        const targetUrl = process.env.SCRAPE_URL || 'https://example.com';

        await page.goto(targetUrl, { waitUntil: 'networkidle' });

        // 等待页面加载
        await page.waitForTimeout(2000);

        // 爬取数据 - 这里是一个示例，您需要根据实际需求修改
        const data = await page.evaluate(() => {
            // 示例：爬取页面上的所有链接
            const links = Array.from(document.querySelectorAll('a')).map(link => ({
                text: link.textContent?.trim() || '',
                href: link.href,
                timestamp: new Date().toISOString()
            }));

            // 示例：爬取页面标题和描述
            const title = document.title;
            const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

            return {
                title,
                description,
                links: links.slice(0, 20), // 只取前20个链接
                scrapedAt: new Date().toISOString()
            };
        });

        await context.close();
        return data;

    } finally {
        await browser.close();
    }
}

async function saveDataAndGetDiff(newData: any) {
    let previousData = null;
    let currentData = null;

    // 读取当前数据（如果存在）
    if (fs.existsSync(CURRENT_FILE)) {
        try {
            const currentContent = fs.readFileSync(CURRENT_FILE, 'utf8');
            currentData = JSON.parse(currentContent);
        } catch (error) {
            console.error('Error reading current data:', error);
        }
    }

    // 如果有当前数据，将其移动到 previous
    if (currentData) {
        fs.writeFileSync(PREVIOUS_FILE, JSON.stringify(currentData, null, 2));
        previousData = currentData;
    }

    // 保存新数据作为当前数据
    fs.writeFileSync(CURRENT_FILE, JSON.stringify(newData, null, 2));

    // 计算差异
    const diff = calculateDiff(previousData, newData);

    return diff;
}

function calculateDiff(previous: any, current: any) {
    if (!previous) {
        return {
            type: 'initial',
            message: 'This is the first scraping, no comparison available',
            currentCount: current?.links?.length || 0
        };
    }

    const prevLinks = previous.links || [];
    const currLinks = current.links || [];

    // 找到新增的链接
    const newLinks = currLinks.filter((curr: any) =>
        !prevLinks.some((prev: any) => prev.href === curr.href)
    );

    // 找到删除的链接
    const removedLinks = prevLinks.filter((prev: any) =>
        !currLinks.some((curr: any) => curr.href === prev.href)
    );

    // 找到文本变化的链接
    const modifiedLinks = currLinks.filter((curr: any) => {
        const prevLink = prevLinks.find((prev: any) => prev.href === curr.href);
        return prevLink && prevLink.text !== curr.text;
    });

    return {
        type: 'comparison',
        summary: {
            previousCount: prevLinks.length,
            currentCount: currLinks.length,
            newCount: newLinks.length,
            removedCount: removedLinks.length,
            modifiedCount: modifiedLinks.length
        },
        changes: {
            new: newLinks.slice(0, 10), // 只显示前10个
            removed: removedLinks.slice(0, 10),
            modified: modifiedLinks.slice(0, 10)
        },
        titleChanged: previous.title !== current.title,
        descriptionChanged: previous.description !== current.description
    };
}

import { NextResponse } from 'next/server';
import { runDeBankScraper } from '@/lib/debank-scraper';

export async function POST() {
    try {
        console.log('🚀 开始 DeBank 数据爬取...');

        const comparison = await runDeBankScraper();

        return NextResponse.json({
            success: true,
            message: '数据爬取成功',
            data: comparison,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('爬取失败:', error);

        return NextResponse.json({
            success: false,
            message: '数据爬取失败',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: '使用 POST 请求启动数据爬取',
        endpoints: {
            scrape: 'POST /api/debank/scrape',
            data: 'GET /api/debank/data'
        }
    });
} 
import { NextResponse } from 'next/server';
import { runDeBankScraper } from '@/lib/debank-scraper';

export async function GET() {
    try {
        console.log('🕐 Cron job started at:', new Date().toISOString());

        const comparison = await runDeBankScraper();

        return NextResponse.json({
            success: true,
            message: `DeBank 数据爬取完成 - 总价值: $${comparison.totalValue.toFixed(2)}`,
            timestamp: new Date().toISOString(),
            dataCount: comparison.addresses.length,
            diff: {
                type: 'comparison',
                currentCount: comparison.addresses.length,
                totalValue: comparison.totalValue,
                totalValueChange: comparison.totalValueChange,
                totalValueChangePercent: comparison.totalValueChangePercent
            },
            source: 'DeBank Portfolio Scraper'
        });
    } catch (error) {
        console.error('Cron job failed:', error);

        return NextResponse.json({
            success: false,
            message: 'DeBank 数据爬取失败',
            timestamp: new Date().toISOString(),
            dataCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 
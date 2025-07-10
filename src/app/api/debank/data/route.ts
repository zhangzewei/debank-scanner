import { NextResponse } from 'next/server';
import { loadLatestData } from '@/lib/debank-scraper';

export async function GET() {
    try {
        const data = loadLatestData();

        if (!data) {
            return NextResponse.json({
                success: false,
                message: '没有找到数据，请先运行爬取',
                data: null
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: '数据获取成功',
            data
        });
    } catch (error) {
        console.error('获取数据失败:', error);

        return NextResponse.json({
            success: false,
            message: '获取数据失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 
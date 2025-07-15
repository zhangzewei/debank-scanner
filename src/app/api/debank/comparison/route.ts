import { NextResponse } from 'next/server';
import { loadLatestData, compareData } from '@/lib/debank-scraper';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // 加载最新数据
        const latestData = loadLatestData();

        if (!latestData) {
            return NextResponse.json({
                success: false,
                message: '没有找到数据，请先运行爬取',
                data: null
            }, { status: 404 });
        }

        // 尝试加载历史数据进行对比
        const dataDir = path.join(process.cwd(), 'data');
        const files = fs.readdirSync(dataDir)
            .filter(file => file.startsWith('debank-data-') && file.endsWith('.json'))
            .sort()
            .reverse();

        let previousData = null;

        // 如果有多个历史文件，取倒数第二个作为对比
        if (files.length > 1) {
            const previousFile = files[1];
            const previousPath = path.join(dataDir, previousFile);
            const previousContent = fs.readFileSync(previousPath, 'utf-8');
            previousData = JSON.parse(previousContent);
        }

        // 生成对比数据
        const comparison = compareData(latestData, previousData);

        return NextResponse.json({
            success: true,
            message: '对比数据获取成功',
            data: comparison
        });
    } catch (error) {
        console.error('获取对比数据失败:', error);

        return NextResponse.json({
            success: false,
            message: '获取对比数据失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 
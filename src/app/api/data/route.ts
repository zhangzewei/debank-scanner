import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ScrapedData, DataDiff, LinkData } from '@/types/scraped-data';

const DATA_DIR = path.join(process.cwd(), 'data');
const CURRENT_FILE = path.join(DATA_DIR, 'current.json');
const PREVIOUS_FILE = path.join(DATA_DIR, 'previous.json');

export async function GET() {
  try {
    // 确保数据目录存在
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let currentData: ScrapedData | null = null;
    let previousData: ScrapedData | null = null;

    // 读取当前数据
    if (fs.existsSync(CURRENT_FILE)) {
      try {
        const currentContent = fs.readFileSync(CURRENT_FILE, 'utf8');
        currentData = JSON.parse(currentContent) as ScrapedData;
      } catch (error) {
        console.error('Error reading current data:', error);
      }
    }

    // 读取上一次数据
    if (fs.existsSync(PREVIOUS_FILE)) {
      try {
        const previousContent = fs.readFileSync(PREVIOUS_FILE, 'utf8');
        previousData = JSON.parse(previousContent) as ScrapedData;
      } catch (error) {
        console.error('Error reading previous data:', error);
      }
    }

    // 如果有数据，计算差异
    let diff: DataDiff | null = null;
    if (currentData && previousData) {
      diff = calculateDiff(previousData, currentData);
    }

    return NextResponse.json({
      success: true,
      current: currentData,
      previous: previousData,
      diff: diff,
      hasData: !!currentData
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({
      error: 'Failed to fetch data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function calculateDiff(previous: ScrapedData, current: ScrapedData): DataDiff {
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
  const newLinks = currLinks.filter((curr: LinkData) =>
    !prevLinks.some((prev: LinkData) => prev.href === curr.href)
  );

  // 找到删除的链接
  const removedLinks = prevLinks.filter((prev: LinkData) =>
    !currLinks.some((curr: LinkData) => curr.href === prev.href)
  );

  // 找到文本变化的链接
  const modifiedLinks = currLinks.filter((curr: LinkData) => {
    const prevLink = prevLinks.find((prev: LinkData) => prev.href === curr.href);
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
      new: newLinks,
      removed: removedLinks,
      modified: modifiedLinks
    },
    titleChanged: previous.title !== current.title,
    descriptionChanged: previous.description !== current.description
  };
}

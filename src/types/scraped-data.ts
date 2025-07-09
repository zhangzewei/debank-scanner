// 链接数据类型
export interface LinkData {
  text: string;
  href: string;
  timestamp: string;
}

// 爬取的数据类型
export interface ScrapedData {
  title: string;
  description: string;
  links: LinkData[];
  scrapedAt: string;
}

// 数据差异汇总类型
export interface DiffSummary {
  previousCount: number;
  currentCount: number;
  newCount: number;
  removedCount: number;
  modifiedCount: number;
}

// 数据变化类型
export interface DiffChanges {
  new: LinkData[];
  removed: LinkData[];
  modified: LinkData[];
}

// 数据差异类型
export interface DataDiff {
  type: 'initial' | 'comparison';
  message?: string;
  currentCount?: number;
  summary?: DiffSummary;
  changes?: DiffChanges;
  titleChanged?: boolean;
  descriptionChanged?: boolean;
}

// Cron 执行结果类型
export interface CronResult {
  success: boolean;
  message: string;
  timestamp: string;
  dataCount: number;
  diff?: DataDiff;
  source?: string;
}

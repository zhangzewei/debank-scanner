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

// DeBank 相关类型
export interface ProjectInfo {
  name: string;
  amount: string;
  amountUSD: number;
}

export interface WalletInfo {
  amount: string;
  amountUSD: number;
}

export interface AddressData {
  address: string;
  totalBalance: string;
  totalBalanceUSD: number;
  wallet: WalletInfo | null;
  projects: ProjectInfo[];
  scrapedAt: string;
}

export interface AddressComparison {
  address: string;
  current: AddressData;
  previous: AddressData | null;
  changes: {
    totalBalanceChange: number;
    totalBalanceChangePercent: number;
    walletChange: number;
    projectChanges: Array<{
      name: string;
      change: number;
      changePercent: number;
    }>;
  };
}

export interface DeBankData {
  [address: string]: AddressData;
}

export interface DeBankComparison {
  timestamp: string;
  totalValue: number;
  totalValueChange: number;
  totalValueChangePercent: number;
  addresses: AddressComparison[];
}

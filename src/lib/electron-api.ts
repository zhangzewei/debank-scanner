// Electron API 适配器
// 用于在Electron环境中替代原来的API路由调用

declare global {
    interface Window {
        electronAPI?: {
            scrapeDeBank: () => Promise<any>;
            getDebankData: () => Promise<any>;
            runCron: () => Promise<any>;
            getComparison: () => Promise<any>;
            getPlatform: () => Promise<any>;
            onScrapingProgress: (callback: (data: any) => void) => void;
            removeAllListeners: (channel: string) => void;
        };
    }
}

// 检查是否在Electron环境中
export const isElectron = () => {
    return typeof window !== 'undefined' && window.electronAPI;
};

// API适配器类
export class ElectronAPI {
    // 执行DeBank数据爬取
    static async scrapeDeBank() {
        console.log('scrapeDeBank called');
        console.log('isElectron:', isElectron());
        console.log('window.electronAPI:', typeof window !== 'undefined' ? window.electronAPI : 'undefined');

        if (isElectron()) {
            console.log('Using Electron IPC');
            return await window.electronAPI!.scrapeDeBank();
        } else {
            console.log('Using HTTP API fallback');
            // 在浏览器环境中使用原来的API
            const response = await fetch('/api/debank/scrape', {
                method: 'POST',
            });
            return await response.json();
        }
    }

    // 获取DeBank数据
    static async getDebankData() {
        if (isElectron()) {
            return await window.electronAPI!.getDebankData();
        } else {
            const response = await fetch('/api/debank/data');
            return await response.json();
        }
    }

    // 运行定时任务
    static async runCron() {
        if (isElectron()) {
            return await window.electronAPI!.runCron();
        } else {
            const response = await fetch('/api/cron');
            return await response.json();
        }
    }

    // 获取比较数据
    static async getComparison() {
        if (isElectron()) {
            return await window.electronAPI!.getComparison();
        } else {
            const response = await fetch('/api/debank/comparison');
            return await response.json();
        }
    }

    // 获取平台信息
    static async getPlatform() {
        if (isElectron()) {
            return await window.electronAPI!.getPlatform();
        } else {
            return {
                platform: 'web',
                arch: 'unknown',
                version: 'unknown',
                electron: 'not-electron'
            };
        }
    }

    // 监听爬取进度
    static onScrapingProgress(callback: (data: any) => void) {
        if (isElectron()) {
            window.electronAPI!.onScrapingProgress(callback);
        }
    }

    // 移除事件监听器
    static removeAllListeners(channel: string) {
        if (isElectron()) {
            window.electronAPI!.removeAllListeners(channel);
        }
    }
}

export default ElectronAPI; 
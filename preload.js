const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // DeBank 数据爬取
    scrapeDeBank: () => ipcRenderer.invoke('scrape-debank'),

    // 获取数据
    getDebankData: () => ipcRenderer.invoke('get-debank-data'),

    // 运行定时任务
    runCron: () => ipcRenderer.invoke('run-cron'),

    // 比较数据
    getComparison: () => ipcRenderer.invoke('get-comparison'),

    // 获取平台信息
    getPlatform: () => ipcRenderer.invoke('get-platform'),

    // 监听事件
    onScrapingProgress: (callback) => {
        ipcRenderer.on('scraping-progress', (event, data) => callback(data));
    },

    // 移除监听器
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
}); 
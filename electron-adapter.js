// Electron适配器 - 用于在主进程中调用JavaScript模块
const path = require('path');

// 导出适配器函数
module.exports = {
    async runDeBankScraper() {
        try {
            // 使用JavaScript版本的scraper
            const scraper = require('./lib-debank-scraper.js');
            return await scraper.runDeBankScraper();
        } catch (error) {
            console.error('Failed to load debank-scraper:', error);
            throw error;
        }
    },

    loadLatestData() {
        try {
            const scraper = require('./lib-debank-scraper.js');
            return scraper.loadLatestData();
        } catch (error) {
            console.error('Failed to load latest data:', error);
            throw error;
        }
    },

    loadPreviousData() {
        try {
            const scraper = require('./lib-debank-scraper.js');
            return scraper.loadPreviousData();
        } catch (error) {
            console.error('Failed to load previous data:', error);
            throw error;
        }
    },

    compareData(current, previous) {
        try {
            const scraper = require('./lib-debank-scraper.js');
            return scraper.compareData(current, previous);
        } catch (error) {
            console.error('Failed to compare data:', error);
            throw error;
        }
    }
}; 
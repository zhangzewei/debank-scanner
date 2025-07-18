const { app, BrowserWindow, Menu, dialog, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';
console.log('Environment:', { NODE_ENV: process.env.NODE_ENV, isDev });

// 保持对窗口对象的全局引用，如果不这样做，当JavaScript对象被垃圾回收时，窗口将自动关闭。
let mainWindow;

function createWindow() {
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'default',
        show: false // 先不显示，等待ready-to-show事件
    });

    // 在开发环境中加载本地服务器，在生产环境中加载静态文件
    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, './out/index.html')}`;

    console.log('Loading URL:', startUrl);
    console.log('__dirname:', __dirname);
    console.log('Static file path exists:', require('fs').existsSync(path.join(__dirname, './out/index.html')));

    mainWindow.loadURL(startUrl);

    // 添加加载错误处理
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load:', { errorCode, errorDescription, validatedURL });
    });

    // 添加页面加载完成事件
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page loaded successfully');
    });

    // 窗口准备好显示时再显示，避免视觉闪烁
    mainWindow.once('ready-to-show', () => {
        console.log('Window ready to show');
        mainWindow.show();
        mainWindow.focus(); // 确保窗口获得焦点
        mainWindow.moveTop(); // 移到最前面

        // 总是打开开发者工具以便调试
        mainWindow.webContents.openDevTools();
    });

    // 添加超时回调以防ready-to-show事件未触发
    setTimeout(() => {
        if (!mainWindow.isVisible()) {
            console.log('Window not visible after timeout, forcing show');
            mainWindow.show();
            mainWindow.focus();
        }
    }, 3000);

    // 当窗口被关闭时发出的事件
    mainWindow.on('closed', () => {
        // 取消引用window对象，如果你的应用支持多窗口，你将在此处存储窗口到数组中
        mainWindow = null;
    });

    // 处理页面导航
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        if (parsedUrl.origin !== startUrl && !isDev) {
            event.preventDefault();
        }
    });

    // 创建应用菜单
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: 'DeFi Scanner',
            submenu: [
                {
                    label: '关于 DeFi Scanner',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: '关于',
                            message: 'DeFi Scanner',
                            detail: '一个强大的DeFi数据扫描工具'
                        });
                    }
                },
                { type: 'separator' },
                { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
            ]
        },
        {
            label: '编辑',
            submenu: [
                { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                { type: 'separator' },
                { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
            ]
        },
        {
            label: '查看',
            submenu: [
                { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
                { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
                { type: 'separator' },
                { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
                { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
                { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
                { type: 'separator' },
                { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
            ]
        },
        {
            label: '窗口',
            submenu: [
                { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
                { label: '关闭', accelerator: 'CmdOrCtrl+W', role: 'close' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// 禁用硬件加速以解决GPU错误
app.disableHardwareAcceleration();

// 注册文件协议
app.whenReady().then(() => {
    // 设置文件协议处理器
    protocol.interceptFileProtocol('file', (request, callback) => {
        const url = request.url.substr(7); // 移除 'file://' 前缀

        // 如果请求的是根路径的静态文件，重定向到out目录
        if (url.startsWith('/_next/')) {
            const filePath = path.join(__dirname, 'out', url.substring(1)); // 移除开头的'/'
            callback({ path: filePath });
        } else if (url === __dirname + '/out/index.html' || url.endsWith('index.html')) {
            callback({ path: path.join(__dirname, 'out', 'index.html') });
        } else {
            callback({ path: url });
        }
    });

    // 设置用户数据目录路径
    setUserDataPath(app.getPath('userData'));

    createWindow();
});

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', () => {
    // 在macOS上，通常用户关闭所有窗口后应用仍然运行，直到用户按Cmd + Q明确退出
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // 在macOS上，当点击dock图标且没有其他窗口打开时，通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// 阻止新窗口的创建
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
    });
});

// IPC 处理器
const electronAdapter = require('./electron-adapter.js');

// 设置用户数据目录路径
const setUserDataPath = (userDataPath) => {
    process.env.ELECTRON_USER_DATA = userDataPath;
};

ipcMain.handle('scrape-debank', async () => {
    try {
        const comparison = await electronAdapter.runDeBankScraper();

        return {
            success: true,
            message: '数据爬取成功',
            data: comparison,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('爬取失败:', error);
        return {
            success: false,
            message: '数据爬取失败',
            error: error.message || 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
});

ipcMain.handle('get-debank-data', async () => {
    try {
        const data = electronAdapter.loadLatestData();

        return {
            success: true,
            data: data,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('获取数据失败:', error);
        return {
            success: false,
            message: '获取数据失败',
            error: error.message || 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
});

ipcMain.handle('run-cron', async () => {
    try {
        const comparison = await electronAdapter.runDeBankScraper();

        return {
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
        };
    } catch (error) {
        console.error('Cron job failed:', error);
        return {
            success: false,
            message: 'DeBank 数据爬取失败',
            timestamp: new Date().toISOString(),
            dataCount: 0,
            error: error.message || 'Unknown error'
        };
    }
});

ipcMain.handle('get-comparison', async () => {
    try {
        const latestData = electronAdapter.loadLatestData();

        if (!latestData) {
            return {
                success: false,
                message: '没有找到数据',
                timestamp: new Date().toISOString()
            };
        }

        // 加载历史数据进行比较
        const previousData = electronAdapter.loadPreviousData();
        const comparison = electronAdapter.compareData(latestData, previousData);

        return {
            success: true,
            data: comparison,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('获取比较数据失败:', error);
        return {
            success: false,
            message: '获取比较数据失败',
            error: error.message || 'Unknown error',
            timestamp: new Date().toISOString()
        };
    }
});

ipcMain.handle('get-platform', () => {
    return {
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        electron: process.versions.electron
    };
}); 
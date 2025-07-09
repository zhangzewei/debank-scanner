'use client';

import { useState, useEffect } from 'react';

import { LinkData, ScrapedData, DataDiff, CronResult } from '@/types/scraped-data';

export default function CronPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [cronResult, setCronResult] = useState<CronResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentData, setCurrentData] = useState<ScrapedData | null>(null);
    const [previousData, setPreviousData] = useState<ScrapedData | null>(null);
    const [diff, setDiff] = useState<DiffData | null>(null);

    // 加载数据
    const loadData = async () => {
        setIsDataLoading(true);
        try {
            const response = await fetch('/api/data');
            const data = await response.json();

            if (data.success) {
                setCurrentData(data.current);
                setPreviousData(data.previous);
                setDiff(data.diff);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsDataLoading(false);
        }
    };

    // 手动触发爬取
    const triggerCron = async () => {
        setIsLoading(true);
        setError(null);
        setCronResult(null);

        try {
            const response = await fetch('/api/cron', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev-secret'}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to trigger cron job');
            }

            setCronResult(data);
            // 重新加载数据
            setTimeout(loadData, 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('zh-CN');
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6">网页爬取与数据对比</h1>

            {/* 控制面板 */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <h2 className="text-xl font-semibold mb-2">控制面板</h2>
                <div className="flex gap-4 items-center">
                    <button
                        onClick={triggerCron}
                        disabled={isLoading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        {isLoading ? '爬取中...' : '手动触发爬取'}
                    </button>
                    <button
                        onClick={loadData}
                        disabled={isDataLoading}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        {isDataLoading ? '加载中...' : '刷新数据'}
                    </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    当前配置：每天午夜 (0点) 运行一次 | 目标网站：{process.env.NEXT_PUBLIC_SCRAPE_URL || 'https://example.com'}
                </p>
            </div>

            {/* 错误显示 */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>错误：</strong> {error}
                </div>
            )}

            {/* 执行结果 */}
            {cronResult && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    <h3 className="font-semibold mb-2">执行结果：</h3>
                    <div className="text-sm">
                        <p>状态：{cronResult.success ? '成功' : '失败'}</p>
                        <p>时间：{formatDate(cronResult.timestamp)}</p>
                        <p>爬取的链接数：{cronResult.dataCount}</p>
                    </div>
                </div>
            )}

            {/* 数据对比 */}
            {diff && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold mb-3">数据变化分析</h3>

                    {diff.type === 'initial' ? (
                        <p className="text-blue-700">这是首次爬取，暂无对比数据</p>
                    ) : (
                        <div className="space-y-4">
                            {/* 概要统计 */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-white p-3 rounded text-center">
                                    <div className="text-2xl font-bold text-gray-600">{diff.summary?.previousCount}</div>
                                    <div className="text-sm text-gray-500">上次数量</div>
                                </div>
                                <div className="bg-white p-3 rounded text-center">
                                    <div className="text-2xl font-bold text-gray-600">{diff.summary?.currentCount}</div>
                                    <div className="text-sm text-gray-500">当前数量</div>
                                </div>
                                <div className="bg-white p-3 rounded text-center">
                                    <div className="text-2xl font-bold text-green-600">{diff.summary?.newCount}</div>
                                    <div className="text-sm text-gray-500">新增</div>
                                </div>
                                <div className="bg-white p-3 rounded text-center">
                                    <div className="text-2xl font-bold text-red-600">{diff.summary?.removedCount}</div>
                                    <div className="text-sm text-gray-500">移除</div>
                                </div>
                                <div className="bg-white p-3 rounded text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{diff.summary?.modifiedCount}</div>
                                    <div className="text-sm text-gray-500">修改</div>
                                </div>
                            </div>

                            {/* 变化详情 */}
                            <div className="grid md:grid-cols-3 gap-4">
                                {/* 新增链接 */}
                                {diff.changes?.new && diff.changes.new.length > 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded p-3">
                                        <h4 className="font-semibold text-green-800 mb-2">新增链接</h4>
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {diff.changes.new.map((link, index) => (
                                                <div key={index} className="text-sm">
                                                    <a href={link.href} target="_blank" rel="noopener noreferrer"
                                                        className="text-green-700 hover:text-green-900 underline">
                                                        {link.text || 'No text'}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 移除链接 */}
                                {diff.changes?.removed && diff.changes.removed.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded p-3">
                                        <h4 className="font-semibold text-red-800 mb-2">移除链接</h4>
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {diff.changes.removed.map((link, index) => (
                                                <div key={index} className="text-sm">
                                                    <span className="text-red-700">{link.text || 'No text'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 修改链接 */}
                                {diff.changes?.modified && diff.changes.modified.length > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                        <h4 className="font-semibold text-yellow-800 mb-2">修改链接</h4>
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {diff.changes.modified.map((link, index) => (
                                                <div key={index} className="text-sm">
                                                    <a href={link.href} target="_blank" rel="noopener noreferrer"
                                                        className="text-yellow-700 hover:text-yellow-900 underline">
                                                        {link.text || 'No text'}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 数据详情 */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* 当前数据 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">当前数据</h3>
                    {isDataLoading ? (
                        <p className="text-gray-500">加载中...</p>
                    ) : currentData ? (
                        <div>
                            <div className="mb-3">
                                <p className="text-sm text-gray-600">标题：{currentData.title}</p>
                                <p className="text-sm text-gray-600">描述：{currentData.description}</p>
                                <p className="text-sm text-gray-600">爬取时间：{formatDate(currentData.scrapedAt)}</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <h4 className="font-medium mb-2">链接列表 ({currentData.links.length})</h4>
                                {currentData.links.map((link, index) => (
                                    <div key={index} className="text-sm mb-1 p-2 bg-gray-50 rounded">
                                        <a href={link.href} target="_blank" rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline">
                                            {link.text || 'No text'}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">暂无数据</p>
                    )}
                </div>

                {/* 上一次数据 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">上一次数据</h3>
                    {isDataLoading ? (
                        <p className="text-gray-500">加载中...</p>
                    ) : previousData ? (
                        <div>
                            <div className="mb-3">
                                <p className="text-sm text-gray-600">标题：{previousData.title}</p>
                                <p className="text-sm text-gray-600">描述：{previousData.description}</p>
                                <p className="text-sm text-gray-600">爬取时间：{formatDate(previousData.scrapedAt)}</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <h4 className="font-medium mb-2">链接列表 ({previousData.links.length})</h4>
                                {previousData.links.map((link, index) => (
                                    <div key={index} className="text-sm mb-1 p-2 bg-gray-50 rounded">
                                        <a href={link.href} target="_blank" rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline">
                                            {link.text || 'No text'}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">暂无历史数据</p>
                    )}
                </div>
            </div>
        </div>
    );
} 
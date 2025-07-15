'use client';

import { useEffect, useState } from 'react';
import { DeBankComparison } from '@/types/scraped-data';

export default function TestPage() {
    const [comparison, setComparison] = useState<DeBankComparison | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadComparison = async () => {
            try {
                const response = await fetch('/api/debank/comparison');
                const result = await response.json();
                if (result.success) {
                    setComparison(result.data);
                }
            } catch (error) {
                console.error('加载对比数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        loadComparison();
    }, []);

    if (loading) {
        return <div className="p-8">加载中...</div>;
    }

    if (!comparison) {
        return <div className="p-8">没有对比数据</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">对比数据测试</h1>

            <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">总价值变化</h2>
                <div className="mb-2">
                    <span className="text-sm text-gray-600">当前总价值: </span>
                    <span className="font-semibold">${comparison.totalValue.toFixed(2)}</span>
                </div>
                <div className="mb-2">
                    <span className="text-sm text-gray-600">变化金额: </span>
                    <span className={`font-semibold ${comparison.totalValueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {comparison.totalValueChange > 0 ? '+' : ''}${comparison.totalValueChange.toFixed(2)}
                    </span>
                </div>
                <div className="mb-2">
                    <span className="text-sm text-gray-600">变化百分比: </span>
                    <span className={`font-semibold ${comparison.totalValueChangePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {comparison.totalValueChangePercent > 0 ? '+' : ''}{comparison.totalValueChangePercent.toFixed(2)}%
                    </span>
                </div>
            </div>

            <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">地址变化详情</h2>
                <div className="space-y-4">
                    {comparison.addresses.map((addr, index) => (
                        <div key={index} className="border-b pb-4">
                            <div className="font-mono text-sm">
                                {addr.address.slice(0, 6)}...{addr.address.slice(-4)}
                            </div>
                            <div className="text-sm text-gray-600">
                                变化:
                                <span className={`ml-2 font-semibold ${addr.changes.totalBalanceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {addr.changes.totalBalanceChange > 0 ? '+' : ''}${addr.changes.totalBalanceChange.toFixed(2)}
                                </span>
                                <span className={`ml-2 ${addr.changes.totalBalanceChangePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ({addr.changes.totalBalanceChangePercent > 0 ? '+' : ''}{addr.changes.totalBalanceChangePercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4">
                <a href="/" className="text-blue-600 hover:text-blue-800">← 返回主页</a>
            </div>
        </div>
    );
} 
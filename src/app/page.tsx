'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DeBankData, AddressData, DeBankComparison } from '@/types/scraped-data';
import ElectronAPI from '@/lib/electron-api';

// 动态导入 ECharts 组件以避免 SSR 问题
const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
});

interface DashboardData {
  success: boolean;
  message: string;
  data: DeBankData | null;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [comparison, setComparison] = useState<DeBankComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);

      // 并行加载数据和对比信息
      const [dataResult, comparisonResult] = await Promise.all([
        ElectronAPI.getDebankData(),
        ElectronAPI.getComparison()
      ]);

      setData(dataResult);

      // 如果对比数据获取成功，则设置对比数据
      if (comparisonResult.success) {
        setComparison(comparisonResult.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setData({
        success: false,
        message: '加载数据失败',
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  // 启动爬取
  const startScraping = async () => {
    console.log('startScraping function called');
    try {
      setScraping(true);
      console.log('About to call ElectronAPI.scrapeDeBank');
      const result = await ElectronAPI.scrapeDeBank();
      console.log('scrapeDeBank result:', result);

      if (result.success) {
        // 保存对比数据
        setComparison(result.data);
        await loadData(); // 重新加载数据
      }
    } catch (error) {
      console.error('爬取失败:', error);
    } finally {
      setScraping(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 计算总价值
  const getTotalValue = () => {
    if (!data?.data) return 0;
    return Object.values(data.data).reduce((sum, addr) => sum + addr.totalBalanceUSD, 0);
  };

  // 生成饼图数据
  const getPieChartData = () => {
    if (!data?.data) return [];

    return Object.values(data.data).map(addr => ({
      name: `${addr.address.slice(0, 6)}...${addr.address.slice(-4)}`,
      value: addr.totalBalanceUSD,
      fullAddress: addr.address
    }));
  };

  // 饼图配置
  const pieChartOption = {
    title: {
      text: '地址资产分布',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const percentage = params.percent;
        const value = params.value;
        return `${params.data.fullAddress}<br/>
                $${value.toLocaleString()} (${percentage}%)`;
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        name: '地址分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: getPieChartData(),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: (params: any) => {
            return `${params.percent}%`;
          }
        }
      }
    ]
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  // 格式化地址
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 格式化变化数据
  const formatChange = (change: number, showSign: boolean = true) => {
    if (change === 0) return '$0';
    const sign = showSign ? (change > 0 ? '+' : '') : '';
    return `${sign}${formatNumber(change)}`;
  };

  // 格式化变化百分比
  const formatChangePercent = (percent: number) => {
    if (percent === 0) return '0%';
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  // 获取变化样式类
  const getChangeStyle = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页眉 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">DeBank 投资组合监控</h1>
            <button
              onClick={startScraping}
              disabled={scraping}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {scraping ? '爬取中...' : '刷新数据'}
            </button>
          </div>
        </div>

        {/* 总价值卡片 */}
        {data?.data && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-600 mb-2">总投资组合价值</h2>
              <div className="text-4xl font-bold text-green-600">
                {formatNumber(getTotalValue())}
              </div>

              {/* 显示变化信息 */}
              {comparison && comparison.totalValueChange !== 0 && (
                <div className="mt-4 flex justify-center items-center gap-4">
                  <div className={`text-lg font-medium ${getChangeStyle(comparison.totalValueChange)}`}>
                    {formatChange(comparison.totalValueChange)}
                  </div>
                  <div className={`text-sm ${getChangeStyle(comparison.totalValueChange)}`}>
                    ({formatChangePercent(comparison.totalValueChangePercent)})
                  </div>
                  <div className="text-xs text-gray-500">
                    与上次对比
                  </div>
                </div>
              )}

              <p className="text-gray-500 mt-2">
                更新时间: {new Date(Object.values(data.data)[0]?.scrapedAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* 没有数据的情况 */}
        {!data?.data && (
          <div className="bg-white rounded-lg p-12 shadow-sm text-center">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无数据</h3>
              <p className="text-gray-500 mb-4">点击&ldquo;刷新数据&rdquo;按钮开始爬取 DeBank 数据</p>
            </div>
            <button
              onClick={startScraping}
              disabled={scraping}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {scraping ? '爬取中...' : '开始爬取'}
            </button>
          </div>
        )}

        {/* 数据展示 */}
        {data?.data && (
          <>
            {/* 饼图 */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
              <ReactECharts option={pieChartOption} style={{ height: '400px' }} />
            </div>

            {/* 地址详情 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.values(data.data).map((address: AddressData) => {
                // 查找对应的对比数据
                const addressComparison = comparison?.addresses.find(addr => addr.address === address.address);

                return (
                  <div key={address.address} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {formatAddress(address.address)}
                      </h3>
                      <div className="text-2xl font-bold text-green-600">
                        {formatNumber(address.totalBalanceUSD)}
                      </div>

                      {/* 地址级别的变化信息 */}
                      {addressComparison && addressComparison.changes.totalBalanceChange !== 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className={`text-sm font-medium ${getChangeStyle(addressComparison.changes.totalBalanceChange)}`}>
                            {formatChange(addressComparison.changes.totalBalanceChange)}
                          </div>
                          <div className={`text-xs ${getChangeStyle(addressComparison.changes.totalBalanceChange)}`}>
                            ({formatChangePercent(addressComparison.changes.totalBalanceChangePercent)})
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 钱包信息 */}
                    {address.wallet && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-1">💳 钱包</h4>
                        <div className="text-blue-700 font-semibold">
                          {formatNumber(address.wallet.amountUSD)}
                        </div>

                        {/* 钱包变化信息 */}
                        {addressComparison && addressComparison.changes.walletChange !== 0 && (
                          <div className="mt-1 flex items-center gap-2">
                            <div className={`text-xs font-medium ${getChangeStyle(addressComparison.changes.walletChange)}`}>
                              {formatChange(addressComparison.changes.walletChange)}
                            </div>
                            <div className="text-xs text-blue-600">
                              钱包变化
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 项目信息 */}
                    {address.projects.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">🔸 项目</h4>
                        <div className="space-y-2">
                          {address.projects
                            .filter(project => project.amountUSD > 0)
                            .sort((a, b) => b.amountUSD - a.amountUSD)
                            .map((project, index) => {
                              // 查找对应的项目变化信息
                              const projectChange = addressComparison?.changes.projectChanges.find(
                                p => p.name === project.name
                              );

                              return (
                                <div key={index} className="p-2 bg-gray-50 rounded">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">{project.name}</span>
                                    <span className="font-semibold text-gray-900">
                                      {formatNumber(project.amountUSD)}
                                    </span>
                                  </div>

                                  {/* 项目变化信息 */}
                                  {projectChange && projectChange.change !== 0 && (
                                    <div className="mt-1 flex items-center gap-2">
                                      <div className={`text-xs font-medium ${getChangeStyle(projectChange.change)}`}>
                                        {formatChange(projectChange.change)}
                                      </div>
                                      <div className={`text-xs ${getChangeStyle(projectChange.change)}`}>
                                        ({formatChangePercent(projectChange.changePercent)})
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* 完整地址 */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        地址: {address.address}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

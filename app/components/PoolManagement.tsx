'use client'

import React, { useState, useEffect } from 'react'
import { BanknotesIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { useWeb3 } from '../contexts/Web3Context'
import { web3Service, formatAddress, formatAmount } from '../services/web3Service'

interface PoolInfo {
  totalBalance: string;
  monthlyInflow: string;
  monthlyOutflow: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: string;
  from: string;
  to: string;
  date: string;
  description: string;
}

interface Contributor {
  address: string;
  totalContributed: string;
  lastContribution: string;
  contributionCount: number;
}

export default function PoolManagement() {
  const { isConnected } = useWeb3();
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [permissions, setPermissions] = useState<{ isOwner: boolean; isManager: boolean; isFirstManager: boolean } | null>(null);

  // 新资金表单状态
  const [newFunds, setNewFunds] = useState({
    amount: '',
    description: ''
  });

  // 加载数据
  const loadData = async () => {
    if (!isConnected) return;

    try {
      setLoading(true);
      setMessage('');

      // 检查权限
      const permissionsData = await web3Service.checkAdminPermissions();
      setPermissions(permissionsData);

      if (permissionsData.isOwner || permissionsData.isManager) {
        // 获取资金池信息
        const poolInfoData = await web3Service.getPoolInfo();
        setPoolInfo({
          totalBalance: formatAmount(poolInfoData[0]), // totalBalance
          monthlyInflow: formatAmount(poolInfoData[1]), // monthlyInflow
          monthlyOutflow: formatAmount(poolInfoData[2]) // monthlyOutflow
        });

        // 获取最近交易
        const transactionsData = await web3Service.getRecentTransactions(10);
        setRecentTransactions(transactionsData || []);

        // 获取顶级贡献者
        const contributorsData = await web3Service.getTopContributors(5);
        if (contributorsData && contributorsData[0] && contributorsData[1]) {
          const addresses = contributorsData[0];
          const amounts = contributorsData[1];
          const contributors = addresses.map((address: string, index: number) => ({
            address,
            totalContributed: amounts[index].toString(),
            lastContribution: new Date().toISOString(), // 暂时使用当前时间
            contributionCount: 1 // 暂时使用默认值
          }));
          setTopContributors(contributors);
        } else {
          setTopContributors([]);
        }
      } else {
        setMessage('当前账户没有查看资金池的权限');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setMessage('加载数据失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 添加资金
  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setMessage('请先连接钱包');
      return;
    }

    if (!permissions?.isOwner && !permissions?.isManager) {
      setMessage('当前账户没有添加资金的权限');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await web3Service.addFunds(parseFloat(newFunds.amount), newFunds.description || '用户注入资金');
      setMessage('资金添加成功！');
      setNewFunds({ amount: '', description: '' });
      setShowAddFundsModal(false);
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('添加资金失败:', error);
      setMessage('添加资金失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 计算净变化
  const getNetChange = () => {
    if (!poolInfo) return '0 ETH';
    const inflow = parseFloat(poolInfo.monthlyInflow.replace(' ETH', ''));
    const outflow = parseFloat(poolInfo.monthlyOutflow.replace(' ETH', ''));
    const netChange = inflow - outflow;
    return `${netChange >= 0 ? '+' : ''}${netChange.toFixed(2)} ETH`;
  };

  // 当连接状态改变时加载数据
  useEffect(() => {
    if (isConnected) {
      loadData();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="card slide-in-up">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">需要连接钱包</h2>
            <p className="text-yellow-700">请先连接MetaMask钱包以查看资金池管理功能。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center slide-in-up">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">资金池管理</h2>
          <p className="text-gray-600">管理平台资金池和资金流向</p>
        </div>
        <button 
          onClick={() => setShowAddFundsModal(true)}
          disabled={loading || (!permissions?.isOwner && !permissions?.isManager)}
          className="btn-primary flex items-center button-press hover-glow bounce-in disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          注入资金
        </button>
      </div>

      {/* 权限信息 */}
      {permissions && (
        <div className="card slide-in-left">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">当前权限</h3>
            <div className="flex space-x-4 text-sm">
              <span className={`flex items-center ${permissions.isOwner ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${permissions.isOwner ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                合约所有者: {permissions.isOwner ? '是' : '否'}
              </span>
              <span className={`flex items-center ${permissions.isManager ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${permissions.isManager ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                管理员: {permissions.isManager ? '是' : '否'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 消息提示 */}
      {message && (
        <div className={`card slide-in-left ${
          message.includes('成功') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className={`p-4 rounded-lg ${
            message.includes('成功') ? 'text-green-800' : 'text-red-800'
          }`}>
            {message}
          </div>
        </div>
      )}

      {/* 资金池概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card card-hover scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500 hover-glow">
              <BanknotesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总余额</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '加载中...' : (poolInfo?.totalBalance || '0 ETH')}
              </p>
            </div>
          </div>
        </div>
        <div className="card card-hover scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500 hover-glow">
              <ArrowUpIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">月度流入</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '加载中...' : (poolInfo?.monthlyInflow || '0 ETH')}
              </p>
            </div>
          </div>
        </div>
        <div className="card card-hover scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500 hover-glow">
              <ArrowDownIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">月度流出</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '加载中...' : (poolInfo?.monthlyOutflow || '0 ETH')}
              </p>
            </div>
          </div>
        </div>
        <div className="card card-hover scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500 hover-glow">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">净变化</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '加载中...' : getNetChange()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 最近交易和贡献者 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近交易 */}
        <div className="card slide-in-left">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近交易</h3>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full ${
                        tx.type === 'inflow' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.type === 'inflow' ? (
                          <ArrowUpIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                        <p className="text-xs text-gray-500">
                          {tx.type === 'inflow' ? `来自: ${formatAddress(tx.from)}` : `发送至: ${formatAddress(tx.to)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatAmount(tx.amount)}</p>
                      <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">暂无交易记录</div>
              )}
            </div>
          )}
        </div>

        {/* 顶级贡献者 */}
        <div className="card slide-in-right">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">顶级贡献者</h3>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {topContributors.length > 0 ? (
                topContributors.map((contributor, index) => (
                  <div key={contributor.address} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 font-mono">{formatAddress(contributor.address)}</p>
                        <p className="text-xs text-gray-500">贡献次数: {contributor.contributionCount}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatAmount(contributor.totalContributed)}</p>
                      <p className="text-xs text-gray-500">{new Date(contributor.lastContribution).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">暂无贡献者数据</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 添加资金模态框 */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 fade-in">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white scale-in">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 slide-in-up">注入资金</h3>
              <form onSubmit={handleAddFunds} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">金额 (ETH)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={newFunds.amount}
                    onChange={(e) => setNewFunds({ ...newFunds, amount: e.target.value })}
                    className="input-field" 
                    placeholder="0.1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">描述</label>
                  <input 
                    type="text" 
                    value={newFunds.description}
                    onChange={(e) => setNewFunds({ ...newFunds, description: e.target.value })}
                    className="input-field" 
                    placeholder="资金用途描述"
                  />
                </div>
                <div className="flex space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddFundsModal(false)} 
                    className="btn-secondary flex-1 button-press hover-glow"
                    disabled={loading}
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 button-press hover-glow"
                    disabled={loading}
                  >
                    {loading ? '添加中...' : '添加资金'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
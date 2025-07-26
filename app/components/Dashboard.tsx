'use client'

import React, { useState, useEffect } from 'react'
import { 
  UsersIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import { useWeb3 } from '../contexts/Web3Context'
import { web3Service, formatAmount } from '../services/web3Service'

export default function Dashboard() {
  const { isConnected } = useWeb3()
  const [stats, setStats] = useState([
    {
      name: '总用户数',
      value: '0',
      change: '+0%',
      changeType: 'increase' as const,
      icon: UsersIcon,
      color: 'bg-blue-500'
    },
    {
      name: '资金池余额',
      value: '0 ETH',
      change: '+0%',
      changeType: 'increase' as const,
      icon: BanknotesIcon,
      color: 'bg-green-500'
    },
    {
      name: '本月拨款',
      value: '0 ETH',
      change: '+0%',
      changeType: 'increase' as const,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500'
    },
    {
      name: '待审核申请',
      value: '0',
      change: '+0%',
      changeType: 'increase' as const,
      icon: ChartBarIcon,
      color: 'bg-orange-500'
    }
  ])
  const [recentGrants, setRecentGrants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    if (!isConnected) return
    
    try {
      setLoading(true)
      
      // 获取统计数据
      const [usersData, poolInfoData, applicationsData] = await Promise.all([
        web3Service.getAllUsers(),
        web3Service.getPoolInfo(),
        web3Service.getAllApplications()
      ])

      // 计算统计数据
      const totalUsers = usersData.length
      const totalBalance = formatAmount(poolInfoData[0])
      const monthlyOutflow = formatAmount(poolInfoData[2])
      const pendingApplications = applicationsData.filter((app: any) => app.status === 0).length

      // 更新统计卡片
      setStats([
        {
          name: '总用户数',
          value: totalUsers.toString(),
          change: '+0%',
          changeType: 'increase' as const,
          icon: UsersIcon,
          color: 'bg-blue-500'
        },
        {
          name: '资金池余额',
          value: totalBalance,
          change: '+0%',
          changeType: 'increase' as const,
          icon: BanknotesIcon,
          color: 'bg-green-500'
        },
        {
          name: '本月拨款',
          value: monthlyOutflow,
          change: '+0%',
          changeType: 'increase' as const,
          icon: CurrencyDollarIcon,
          color: 'bg-purple-500'
        },
        {
          name: '待审核申请',
          value: pendingApplications.toString(),
          change: '+0%',
          changeType: 'increase' as const,
          icon: ChartBarIcon,
          color: 'bg-orange-500'
        }
      ])

      // 获取最近的拨款记录
      const recentApplications = applicationsData
        .filter((app: any) => app.status === 1) // 已批准的申请
        .slice(0, 5)
        .map((app: any) => ({
          id: app.id,
          userName: `用户${app.userId}`,
          amount: formatAmount(app.amount),
          status: '已拨款',
          date: new Date(Number(app.appliedDate) * 1000).toLocaleDateString(),
          healthStatus: 'Healthy'
        }))

      setRecentGrants(recentApplications)

    } catch (error) {
      console.error('加载仪表板数据失败:', error)
      // 显示用户友好的错误信息
      alert('加载仪表板数据失败，请检查网络连接或稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      loadData()
    }
  }, [isConnected])

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="card slide-in-up">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">需要连接钱包</h2>
            <p className="text-yellow-700">请先连接MetaMask钱包以查看仪表板数据。</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="slide-in-up">
          <h2 className="text-2xl font-bold text-gray-900">仪表板</h2>
          <p className="text-gray-600">平台运营概览和关键指标</p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="slide-in-up">
        <h2 className="text-2xl font-bold text-gray-900">仪表板</h2>
        <p className="text-gray-600">平台运营概览和关键指标</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card card-hover scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color} hover-glow`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {stat.changeType === 'increase' ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`ml-1 text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="ml-2 text-sm text-gray-500">较上月</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 最近拨款记录 */}
      <div className="card slide-in-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">最近拨款记录</h3>
          <button className="btn-primary button-press hover-glow">查看全部</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  拨款金额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  健康状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentGrants.map((grant, index) => (
                <tr key={grant.id} className="hover:bg-gray-50 transition-colors duration-200" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{grant.userName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{grant.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      grant.healthStatus === 'Healthy' ? 'status-healthy' :
                      grant.healthStatus === 'Sick' ? 'status-sick' : 'status-critical'
                    }`}>
                      {grant.healthStatus === 'Healthy' ? '健康' :
                       grant.healthStatus === 'Sick' ? '病态' : '危急'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      grant.status === '已拨款' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {grant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grant.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 
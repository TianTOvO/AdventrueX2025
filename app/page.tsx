'use client'

import React, { useState } from 'react'
import { useUser } from './contexts/UserContext'
import Header from './components/Header'
import UserManagement from './components/UserManagement'
import GrantManagement from './components/GrantManagement'
import Dashboard from './components/Dashboard'
import PoolManagement from './components/PoolManagement'
import UserDashboard from './components/UserDashboard'
import UserSettings from './components/UserSettings'
import UserApplications from './components/UserApplications'
import ContractInteraction from './components/ContractInteraction'

export default function Home() {
  const { isUserMode, isAdminMode, switchToAdmin } = useUser()
  const [activeTab, setActiveTab] = useState('dashboard')

  // 确保默认是管理员模式
  React.useEffect(() => {
    if (!isUserMode && !isAdminMode) {
      switchToAdmin()
    }
  }, [isUserMode, isAdminMode, switchToAdmin])

  const adminTabs = [
    { id: 'dashboard', name: '仪表板', icon: '📊' },
    { id: 'users', name: '用户管理', icon: '👥' },
    { id: 'grants', name: '拨款管理', icon: '💰' },
    { id: 'pool', name: '资金池', icon: '🏦' },
    { id: 'contracts', name: '合约交互', icon: '🔗' },
  ]

  const userTabs = [
    { id: 'dashboard', name: '我的主页', icon: '🏠' },
    { id: 'applications', name: '申请历史', icon: '📋' },
    { id: 'settings', name: '个人设置', icon: '⚙️' },
  ]

  const renderContent = () => {
    if (isUserMode) {
      switch (activeTab) {
        case 'dashboard':
          return <UserDashboard />
        case 'applications':
          return <UserApplications />
        case 'settings':
          return <UserSettings />
        default:
          return <UserDashboard />
      }
    } else {
      switch (activeTab) {
        case 'dashboard':
          return <Dashboard />
        case 'users':
          return <UserManagement />
        case 'grants':
          return <GrantManagement />
        case 'pool':
          return <PoolManagement />
        case 'contracts':
          return <ContractInteraction />
        default:
          return <Dashboard />
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {/* 侧边栏 */}
        <div className="w-64 bg-white shadow-sm min-h-screen slide-in-left">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              {(isUserMode ? userTabs : adminTabs).map((tab: any, index: number) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-out hover-lift button-press ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600 scale-in'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="text-lg mr-3 bounce-in">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto fade-in">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
} 
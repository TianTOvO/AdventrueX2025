'use client'

import React, { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { 
  UserIcon, 
  CogIcon, 
  ShieldCheckIcon,
  BellIcon,
  KeyIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'

export default function UserSettings() {
  const { currentUser } = useUser()
  const [activeTab, setActiveTab] = useState('profile')
  const [showEditModal, setShowEditModal] = useState(false)

  const tabs = [
    { id: 'profile', name: '个人信息', icon: UserIcon },
    { id: 'security', name: '安全设置', icon: ShieldCheckIcon },
    { id: 'notifications', name: '通知设置', icon: BellIcon },
    { id: 'documents', name: '文档管理', icon: DocumentIcon }
  ]

  const getHealthStatusText = (status: string) => {
    switch (status) {
      case 'Healthy':
        return '健康'
      case 'Sick':
        return '病态'
      case 'Critical':
        return '危急'
      default:
        return status
    }
  }

  const getAreaLevelText = (level: string) => {
    switch (level) {
      case 'City':
        return '城市'
      case 'District':
        return '区县'
      case 'Village':
        return '乡村'
      default:
        return level
    }
  }

  if (!currentUser) {
    return <div>用户信息加载中...</div>
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="card slide-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
          <button 
            onClick={() => setShowEditModal(true)}
            className="btn-primary button-press hover-glow"
          >
            编辑信息
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">姓名</label>
            <p className="mt-1 text-sm text-gray-900">{currentUser.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">年龄</label>
            <p className="mt-1 text-sm text-gray-900">{currentUser.age}岁</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">钱包地址</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{currentUser.address}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">地区层级</label>
            <p className="mt-1 text-sm text-gray-900">{getAreaLevelText(currentUser.areaLevel)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">健康状态</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
              currentUser.healthStatus === 'Healthy' ? 'status-healthy' :
              currentUser.healthStatus === 'Sick' ? 'status-sick' : 'status-critical'
            }`}>
              {getHealthStatusText(currentUser.healthStatus)}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">账户余额</label>
            <p className="mt-1 text-sm text-gray-900">{currentUser.balance}</p>
          </div>
        </div>
      </div>

      <div className="card slide-in-up">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">账户统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-primary-600">3</p>
            <p className="text-sm text-gray-600">总申请数</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">1</p>
            <p className="text-sm text-gray-600">已批准</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">1</p>
            <p className="text-sm text-gray-600">审核中</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="card slide-in-up">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">安全设置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <KeyIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">修改密码</p>
                <p className="text-sm text-gray-500">定期更新密码以提高账户安全性</p>
              </div>
            </div>
            <button className="btn-secondary button-press hover-glow">修改</button>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">两步验证</p>
                <p className="text-sm text-gray-500">启用两步验证以增强账户安全</p>
              </div>
            </div>
            <button className="btn-secondary button-press hover-glow">启用</button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="card slide-in-up">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">通知设置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">申请状态更新</p>
              <p className="text-sm text-gray-500">当申请状态发生变化时通知我</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">拨款到账通知</p>
              <p className="text-sm text-gray-500">当拨款到账时通知我</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">系统公告</p>
              <p className="text-sm text-gray-500">接收系统重要公告和更新</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <div className="card slide-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">文档管理</h3>
          <button className="btn-primary button-press hover-glow">上传文档</button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">身份证件</p>
                <p className="text-sm text-gray-500">已上传 • 2024-01-15</p>
              </div>
            </div>
            <button className="text-primary-600 hover:text-primary-900 hover-glow button-press">查看</button>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">医疗证明</p>
                <p className="text-sm text-gray-500">已上传 • 2024-01-10</p>
              </div>
            </div>
            <button className="text-primary-600 hover:text-primary-900 hover-glow button-press">查看</button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab()
      case 'security':
        return renderSecurityTab()
      case 'notifications':
        return renderNotificationsTab()
      case 'documents':
        return renderDocumentsTab()
      default:
        return renderProfileTab()
    }
  }

  return (
    <div className="space-y-6">
      <div className="slide-in-up">
        <h2 className="text-2xl font-bold text-gray-900">用户设置</h2>
        <p className="text-gray-600">管理您的个人信息和账户设置</p>
      </div>

      <div className="flex space-x-6">
        {/* 设置侧边栏 */}
        <div className="w-64 bg-white shadow-sm rounded-lg p-4 slide-in-left">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-out hover-lift button-press ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600 scale-in'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 fade-in">
          {renderContent()}
        </div>
      </div>

      {/* 编辑信息模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 fade-in">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white scale-in">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 slide-in-up">编辑个人信息</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">姓名</label>
                  <input type="text" className="input-field hover-glow" defaultValue={currentUser.name} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">年龄</label>
                  <input type="number" className="input-field hover-glow" defaultValue={currentUser.age} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">健康状态</label>
                  <select className="input-field hover-glow" defaultValue={currentUser.healthStatus}>
                    <option value="Healthy">健康</option>
                    <option value="Sick">病态</option>
                    <option value="Critical">危急</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setShowEditModal(false)} 
                    className="btn-secondary flex-1 button-press hover-glow"
                  >
                    取消
                  </button>
                  <button type="submit" className="btn-primary flex-1 button-press hover-glow">
                    保存更改
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
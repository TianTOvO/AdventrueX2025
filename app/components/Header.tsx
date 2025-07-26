'use client'

import React, { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { ChevronDownIcon, UserIcon, CogIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { ConnectWalletButton, NetworkInfo, AccountInfo } from '../contexts/Web3Context'

export default function Header() {
  const { currentUser, isUserMode, isAdminMode, switchToAdmin, switchToUser } = useUser()
  const [showUserMenu, setShowUserMenu] = useState(false)

  // 默认用户账户
  const defaultUser = {
    id: 1,
    name: '用户账户',
    age: 30,
    address: '0x1234...5678',
    areaLevel: 'City' as const,
    healthStatus: 'Healthy' as const,
    balance: '¥0'
  }

  const handleSwitchToUser = () => {
    switchToUser(defaultUser)
    setShowUserMenu(false)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl mr-3 bounce-in">🛡️</span>
            <div className="ml-3 slide-in-left">
              <h1 className="text-xl font-semibold text-gray-900">基金会链上拨款平台</h1>
              <p className="text-sm text-gray-500">透明、公平的拨款分配系统</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 slide-in-right">
            {/* Web3连接状态 */}
            <div className="flex flex-col items-end space-y-1">
              <ConnectWalletButton />
              <NetworkInfo />
              <AccountInfo />
            </div>
            
            <button className="p-2 text-gray-400 hover:text-gray-500 hover-glow button-press">
              <span className="text-xl">🔔</span>
            </button>
            
            {/* 用户切换菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 hover-lift p-2 rounded-lg transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center pulse-glow">
                  <span className="text-white text-sm font-medium">
                    {isUserMode ? '用' : '管'}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {isUserMode ? '用户账户' : '管理员'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isUserMode ? '普通用户' : '基金会管理员'}
                  </p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 fade-in">
                  <div className="p-4">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">切换账户模式</p>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            switchToAdmin()
                            setShowUserMenu(false)
                          }}
                          className={`w-full flex items-center p-2 text-sm rounded-lg transition-colors duration-200 ${
                            isAdminMode 
                              ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-xs font-medium">管</span>
                          </div>
                          <div className="text-left">
                            <p className="font-medium">管理员模式</p>
                            <p className="text-xs text-gray-500">基金会管理员</p>
                          </div>
                        </button>
                        
                        <button
                          onClick={handleSwitchToUser}
                          className={`w-full flex items-center p-2 text-sm rounded-lg transition-colors duration-200 ${
                            isUserMode 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-xs font-medium">用</span>
                          </div>
                          <div className="text-left">
                            <p className="font-medium">用户模式</p>
                            <p className="text-xs text-gray-500">普通用户</p>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <button className="w-full flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                        <UserIcon className="h-4 w-4 mr-3" />
                        个人资料
                      </button>
                      <button className="w-full flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                        <CogIcon className="h-4 w-4 mr-3" />
                        设置
                      </button>
                      <button className="w-full flex items-center p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 
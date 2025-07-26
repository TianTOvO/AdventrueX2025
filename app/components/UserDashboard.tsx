'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import { 
  UserIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  PlusIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import UserApplications from './UserApplications'
import { web3Service, formatAmount } from '../services/web3Service'
import { parseEther } from 'ethers';

export default function UserDashboard() {
  const { currentUser, userBalance, isUserMode } = useUser()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [applicationForm, setApplicationForm] = useState({
    amount: '',
    reason: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // 确保currentUser是User类型
  const user = currentUser && 'age' in currentUser ? currentUser : null

  // 如果不在用户模式，显示提示
  if (!isUserMode) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">用户模式</h2>
        <p className="text-gray-600">请切换到用户模式查看用户功能</p>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: '概览', icon: UserIcon },
    { id: 'applications', name: '申请历史', icon: DocumentTextIcon },
  ]

  const [userApplications, setUserApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadUserApplications = async () => {
    if (!isUserMode || !user) return
    
    try {
      setLoading(true)
      
      // 获取用户的申请记录
      const applications = await web3Service.getUserApplications(user.id)
      console.log('Raw applications data:', applications); // Debug log for raw data
      
      const formattedApplications = applications.map((app: any) => {
        const statusNum = Number(app.status); // Ensure status is a number
        const statusStr = statusNum === 0 ? 'pending' : statusNum === 1 ? 'approved' : 'rejected';
        console.log(`Application ID: ${app.id}, Raw Status: ${app.status}, Converted Status: ${statusStr}`); // Debug log for status mapping
        return {
          id: app.id,
          amount: formatAmount(app.amount),
          reason: app.reason,
          status: statusStr,
          appliedDate: new Date(Number(app.appliedDate) * 1000).toLocaleDateString(),
          approvedDate: app.processedDate ? new Date(Number(app.processedDate) * 1000).toLocaleDateString() : null,
          rejectedDate: app.processedDate && statusNum === 2 ? new Date(Number(app.processedDate) * 1000).toLocaleDateString() : null,
          description: app.description
        }
      })
      
      setUserApplications(formattedApplications)
      console.log('Formatted applications:', formattedApplications); // Debug log for final data
    } catch (error) {
      console.error('加载用户申请记录失败:', error)
      // 显示用户友好的错误信息
      alert('加载申请记录失败，请检查网络连接或稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isUserMode && user) {
      loadUserApplications()
    }
  }, [isUserMode, user])

  // 提交申请
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submit button clicked'); // Debug log
    
    if (!user || !isUserMode) {
      alert('请切换到用户模式')
      return
    }

    if (!applicationForm.amount || !applicationForm.reason || !applicationForm.description) {
      alert('请填写完整的申请信息')
      return
    }

    try {
      console.log('Submitting application with data:', { 
        userId: user.id, 
        amount: parseFloat(applicationForm.amount), 
        reason: applicationForm.reason, 
        description: applicationForm.description 
      }); // Debug log
      setSubmitting(true)
      
      const applicationId = await web3Service.submitApplication(
        user.id,
        parseFloat(applicationForm.amount),
        applicationForm.reason,
        applicationForm.description
      )
      console.log('Application submitted successfully, ID:', applicationId); // Debug log
      
      alert('申请提交成功！')
      setApplicationForm({ amount: '', reason: '', description: '' })
      setShowApplyModal(false)
      
      // 重新加载申请记录
      setTimeout(() => {
        loadUserApplications()
        alert('申请状态已更新')
      }, 15000); // Wait 15 seconds for blockchain confirmation to ensure data is updated
      
    } catch (error) {
      console.error('提交申请失败:', error)
      alert('提交申请失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            审核中
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            已批准
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            已拒绝
          </span>
        )
      default:
        return null
    }
  }

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

  const renderOverview = () => {
    // 确保currentUser是User类型
    const user = currentUser && 'age' in currentUser ? currentUser : null
    
    return (
    <div className="space-y-6">
      {/* 用户信息卡片 */}
      <div className="card slide-in-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center pulse-glow">
              <UserIcon className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">{user?.name || '用户账户'}</h2>
              <p className="text-gray-600">用户ID: #{user?.id || 1}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500">年龄: {user?.age || 30}岁</span>
                <span className="text-sm text-gray-500">地区: {getAreaLevelText(user?.areaLevel || 'City')}</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user?.healthStatus === 'Healthy' ? 'status-healthy' :
                  user?.healthStatus === 'Sick' ? 'status-sick' : 'status-critical'
                }`}>
                  {getHealthStatusText(user?.healthStatus || 'Healthy')}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">账户余额</p>
            <p className="text-3xl font-bold text-primary-600">{userBalance}</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card card-hover scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500 hover-glow">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总申请数</p>
              <p className="text-2xl font-semibold text-gray-900">{userApplications.length}</p>
            </div>
          </div>
        </div>
        <div className="card card-hover scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500 hover-glow">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">已批准</p>
              <p className="text-2xl font-semibold text-gray-900">
                {userApplications.filter(app => app.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card card-hover scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500 hover-glow">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">审核中</p>
              <p className="text-2xl font-semibold text-gray-900">
                {userApplications.filter(app => app.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 申请记录 */}
      <div className="card slide-in-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">我的申请记录</h3>
          <button 
            onClick={() => {
              console.log('Apply for Grant button clicked');
              setShowApplyModal(true);
            }}
            className="btn-primary flex items-center button-press hover-glow bounce-in"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            申请拨款
          </button>
        </div>
        
        <div className="space-y-4">
          {userApplications.map((application, index) => (
            <div 
              key={application.id} 
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-900">{application.reason}</h4>
                    {getStatusBadge(application.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{application.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-500">申请金额: {application.amount}</span>
                    <span className="text-sm text-gray-500">申请日期: {application.appliedDate}</span>
                    {application.status === 'approved' && (
                      <span className="text-sm text-green-600">批准日期: {application.approvedDate}</span>
                    )}
                    {application.status === 'rejected' && (
                      <span className="text-sm text-red-600">拒绝日期: {application.rejectedDate}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'applications':
        return <UserApplications />
      default:
        return renderOverview()
    }
  }

  return (
    <div className="space-y-6">
      <div className="slide-in-up">
        <h2 className="text-2xl font-bold text-gray-900">用户主页</h2>
        <p className="text-gray-600">欢迎回来，{user?.name || '用户账户'}</p>
      </div>

      {/* 标签页导航 */}
      <div className="flex space-x-4 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          )
        })}
      </div>

      {/* 内容区域 */}
      <div className="fade-in">
        {renderContent()}
      </div>

      {/* 申请拨款模态框 */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 fade-in">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white scale-in">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 slide-in-up">申请拨款</h3>
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">申请金额 (ETH)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={applicationForm.amount}
                    onChange={(e) => setApplicationForm({ ...applicationForm, amount: e.target.value })}
                    className="input-field hover-glow" 
                    placeholder="请输入申请金额" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">申请原因</label>
                  <select 
                    value={applicationForm.reason}
                    onChange={(e) => setApplicationForm({ ...applicationForm, reason: e.target.value })}
                    className="input-field hover-glow"
                    required
                  >
                    <option value="">请选择申请原因</option>
                    <option value="医疗费用">医疗费用</option>
                    <option value="手术费用">手术费用</option>
                    <option value="康复治疗">康复治疗</option>
                    <option value="药物费用">药物费用</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">详细说明</label>
                  <textarea 
                    value={applicationForm.description}
                    onChange={(e) => setApplicationForm({ ...applicationForm, description: e.target.value })}
                    className="input-field hover-glow" 
                    rows={4} 
                    placeholder="请详细描述您的申请原因和资金用途..."
                    required
                  ></textarea>
                </div>
                <div className="flex space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setShowApplyModal(false)} 
                    className="btn-secondary flex-1 button-press hover-glow"
                    disabled={submitting}
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 button-press hover-glow"
                    disabled={submitting}
                  >
                    {submitting ? '提交中...' : '提交申请'}
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
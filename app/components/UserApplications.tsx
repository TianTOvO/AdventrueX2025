'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import { useWeb3 } from '../contexts/Web3Context'
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { web3Service, formatAmount } from '../services/web3Service'
import { parseEther } from 'ethers';

// 假设的接口，实际项目中应根据需要调整
export interface Application {
  id: number
  userId: number
  amount: string
  reason: string
  status: string
  appliedDate: string
  processedDate: string | null
  description: string
  notes: string
}

export default function UserApplications() {
  const { currentUser, isUserMode } = useUser();
  const { isConnected } = useWeb3();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [applicationForm, setApplicationForm] = useState({ amount: '', reason: '', description: '' });
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // 加载用户申请
  const loadApplications = async () => {
    try {
      setLoading(true);
      console.log('Loading user applications...'); // Debug log
      const userApps = await web3Service.getUserApplications(currentUser ? currentUser.id : 0);
      console.log('Raw user applications data:', userApps); // Debug log
      const formattedApps = userApps.map((app: { id: number, userId: number, amount: string, reason: string, status: number, appliedDate: string, processedDate: string, description: string, notes: string }) => {
        const statusNum = Number(app.status); // Ensure status is a number
        const statusStr = statusNum === 0 ? 'pending' : statusNum === 1 ? 'approved' : 'rejected';
        console.log(`Application ID: ${app.id}, Raw Status: ${app.status}, Converted Status: ${statusStr}`); // Debug log
        return {
          id: app.id,
          userId: app.userId,
          amount: formatAmount(app.amount),
          reason: app.reason,
          status: statusStr,
          appliedDate: new Date(Number(app.appliedDate) * 1000).toLocaleDateString(),
          processedDate: app.processedDate ? new Date(Number(app.processedDate) * 1000).toLocaleDateString() : null,
          description: app.description,
          notes: app.notes || '暂无备注'
        };
      });
      setApplications(formattedApps);
      console.log('Formatted user applications:', formattedApps); // Debug log
    } catch (error) {
      console.error('加载用户申请失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载争议记录从本地存储
  const loadDisputes = () => {
    const storedDisputes = localStorage.getItem('disputes');
    if (storedDisputes) {
      setDisputes(JSON.parse(storedDisputes, (key, value) =>
        typeof value === 'string' && value.startsWith('BigInt(') ? BigInt(value.slice(7, -1)) : value
      ));
      console.log('Loaded disputes from local storage:', JSON.parse(storedDisputes)); // Debug log
    } else {
      setDisputes([]);
      console.log('No disputes found in local storage'); // Debug log
    }
  };

  useEffect(() => {
    if (isConnected && currentUser) {
      loadApplications();
      loadDisputes();
    }
  }, [isConnected, currentUser]);

  // 处理申请提交
  const submitApplication = async () => {
    try {
      setLoading(true);
      console.log('Submitting application with data:', applicationForm); // Debug log
      // 验证输入
      if (!applicationForm.amount || !applicationForm.reason) {
        alert('请填写金额和申请原因');
        return;
      }
      // 调用服务提交申请
      await web3Service.submitApplication(
        currentUser ? currentUser.id : 0,
        Number(applicationForm.amount),
        applicationForm.reason,
        applicationForm.description
      );
      // 提交成功后，清空表单并刷新列表
      setApplicationForm({ amount: '', reason: '', description: '' });
      setShowForm(false);
      alert('申请提交成功');
      console.log('Application submitted successfully'); // Debug log
      // 延迟刷新列表，等待区块链确认
      setTimeout(() => {
        loadApplications();
        console.log('Delayed refresh of applications after submission'); // Debug log
      }, 15000); // 增加延迟时间到15秒
    } catch (error) {
      console.error('提交申请失败:', error);
      alert('提交申请失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 处理发起争议
  const handleInitiateDispute = (applicationId: number) => {
    setSelectedApplicationId(applicationId);
    setShowDisputeModal(true);
  };

  const confirmInitiateDispute = () => {
    if (selectedApplicationId === null) return;
    // 检查是否已对该申请发起过争议
    if (disputes.some(dispute => dispute.applicationId === selectedApplicationId)) {
      alert('该申请已发起过争议，无法重复发起');
      setShowDisputeModal(false);
      return;
    }
    // 创建新的争议记录 - 本地模拟数据
    const newDispute = {
      id: disputes.length + 1,
      applicationId: selectedApplicationId,
      status: 'ongoing',
      votesFor: 0,
      votesAgainst: 0,
      initiatedDate: new Date().toLocaleDateString()
    };
    const updatedDisputes = [...disputes, newDispute];
    setDisputes(updatedDisputes);
    // 保存到本地存储，确保处理 BigInt 类型
    const serializedDisputes = JSON.stringify(updatedDisputes, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    localStorage.setItem('disputes', serializedDisputes);
    alert(`争议 #${newDispute.id} 已成功发起，针对申请 #${selectedApplicationId}`);
    console.log(`Dispute initiated for application ID=${selectedApplicationId}, Dispute ID=${newDispute.id}`); // Debug log
    setShowDisputeModal(false);
    setSelectedApplicationId(null);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-10 text-gray-500">
        请先连接钱包
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">我的申请</h2>
        {!showForm && (
          <button
            onClick={() => {
              console.log('New Application button clicked'); // Debug log
              setShowForm(true);
            }}
            className="btn btn-primary"
          >
            新建申请
          </button>
        )}
      </div>

      {/* 申请表单 */}
      {showForm && (
        <div className="card slide-in-right mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">新建拨款申请</h3>
          <form onSubmit={(e) => { e.preventDefault(); submitApplication(); }}>
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">申请金额 (ETH)</label>
              <input
                type="number"
                id="amount"
                value={applicationForm.amount}
                onChange={(e) => setApplicationForm({ ...applicationForm, amount: e.target.value })}
                className="input-field"
                placeholder="请输入申请金额"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">申请原因</label>
              <input
                type="text"
                id="reason"
                value={applicationForm.reason}
                onChange={(e) => setApplicationForm({ ...applicationForm, reason: e.target.value })}
                className="input-field"
                placeholder="请输入申请原因"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
              <textarea
                id="description"
                value={applicationForm.description}
                onChange={(e) => setApplicationForm({ ...applicationForm, description: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="请输入详细描述"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">取消</button>
              <button type="submit" disabled={loading} className="btn btn-primary">提交</button>
            </div>
          </form>
        </div>
      )}

      {/* 申请列表 */}
      <div className="card slide-in-right">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">申请记录</h3>
        {applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">争议状态</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app, index) => {
                  const dispute = disputes.find(d => d.applicationId === app.id);
                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors duration-200" style={{ animationDelay: `${index * 0.05}s` }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{app.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={app.reason}>
                          {app.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {app.status === 'pending' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">待审核</span>}
                        {app.status === 'approved' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">已批准</span>}
                        {app.status === 'rejected' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">已拒绝</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.appliedDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {app.status === 'rejected' && !dispute ? (
                          <button
                            onClick={() => handleInitiateDispute(app.id)}
                            className="text-blue-600 hover:text-blue-900 hover-glow button-press"
                            title="发起争议"
                          >
                            发起争议
                          </button>
                        ) : app.status === 'rejected' ? (
                          <span className="text-gray-500">争议已发起</span>
                        ) : (
                          <span className="text-gray-500">无操作</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dispute ? (
                          <span>
                            {dispute.status === 'ongoing' ? '争议进行中' : '争议已结束'} - 支持: {dispute.votesFor}, 反对: {dispute.votesAgainst}
                          </span>
                        ) : (
                          <span>无争议</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            暂无申请记录。点击“新建申请”按钮提交您的第一个申请。
          </div>
        )}
      </div>

      {/* 发起争议确认模态框 */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h2 className="text-xl font-bold mb-4">发起争议</h2>
            <p className="text-gray-600 mb-4">您确定要对申请 #{selectedApplicationId} 发起争议吗？争议发起后，争议处理团队将进行投票决定是否批准您的申请。</p>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => { setShowDisputeModal(false); setSelectedApplicationId(null); }} className="btn btn-secondary">取消</button>
              <button type="button" onClick={confirmInitiateDispute} className="btn btn-primary">确认发起</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
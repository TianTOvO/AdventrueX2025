'use client'

import React, { useState, useEffect } from 'react'
import { CurrencyDollarIcon, CheckIcon, XMarkIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useWeb3 } from '../contexts/Web3Context'
import { web3Service, getEnumText, formatAddress, formatAmount } from '../services/web3Service'
import DisputePanel from './DisputePanel'

interface Application {
  id: number;
  userId: number;
  amount: string;
  reason: string;
  description: string;
  status: number;
  appliedDate: string;
  processedDate: string;
  notes: string;
}

interface User {
  id: number;
  userName: string;
  userAge: number;
  userAddress: string;
  userAreaLevel: number;
  userHealthStatus: number;
}

export default function GrantManagement() {
  const { isConnected } = useWeb3();
  const [selectedGrant, setSelectedGrant] = useState<Application | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [permissions, setPermissions] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [recentGrants, setRecentGrants] = useState<any[]>([]);
  // 移除不再需要的状态
  // const [disputes, setDisputes] = useState<any[]>([]);
  // const [disputeTeam, setDisputeTeam] = useState<any[]>([]);
  // const [showJoinTeamModal, setShowJoinTeamModal] = useState(false);
  // const [donationAmount, setDonationAmount] = useState('');

  console.log('GrantManagement component rendering...'); // Debug log

  // 移除 loadDisputes 和 loadDisputeTeam 函数
  // const loadDisputes = () => { ... };
  // const loadDisputeTeam = () => { ... };

  // 加载数据
  const loadData = async () => {
    if (!isConnected) return;

    try {
      setLoading(true);
      setMessage('');

      // 检查权限
      const permissionsData = await web3Service.checkAdminPermissions();
      console.log('Permissions data:', permissionsData); // Debug log
      setPermissions(permissionsData);

      if (permissionsData.isOwner || permissionsData.isManager) {
        const [applicationsData, usersData] = await Promise.all([
          web3Service.getAllApplications(),
          web3Service.getAllUsers()
        ]);
        console.log('Raw applications data:', applicationsData); // Debug log
        console.log('Raw users data:', usersData); // Debug log
        setUsers(usersData);
        
        const formattedApps = applicationsData.map((app: any) => {
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
          }
        });
        setApplications(formattedApps);
        console.log('Formatted applications:', formattedApps); // Debug log
        
        // 计算统计数据
        let pending = 0, approved = 0, rejected = 0, totalAmt = 0;
        formattedApps.forEach((app: { status: string, amount: string }) => {
          if (app.status === 'pending') pending++;
          else if (app.status === 'approved') {
            approved++;
            totalAmt += parseFloat(app.amount.replace(' ETH', ''));
          }
          else if (app.status === 'rejected') rejected++;
        });
        setPendingCount(pending);
        setApprovedCount(approved);
        setRejectedCount(rejected);
        setTotalAmount(totalAmt);
        console.log(`Statistics updated: Pending=${pending}, Approved=${approved}, Rejected=${rejected}, Total Amount=${totalAmt} ETH`); // Debug log
        
        // 计算最近拨款记录（假设最近5个已批准的申请）
        const approvedApps = formattedApps
          .filter((app: { status: string }) => app.status === 'approved')
          .sort((a: { id: number, processedDate: string, appliedDate: string }, b: { id: number, processedDate: string, appliedDate: string }) => {
            const dateA = a.processedDate ? new Date(a.processedDate).getTime() : (a.appliedDate ? new Date(a.appliedDate).getTime() : 0);
            const dateB = b.processedDate ? new Date(b.processedDate).getTime() : (b.appliedDate ? new Date(b.appliedDate).getTime() : 0);
            console.log(`Sorting grants: ID=${a.id}, DateA=${dateA}, ID=${b.id}, DateB=${dateB}`); // Debug log
            return dateB - dateA;
          })
          .slice(0, 5);
        setRecentGrants(approvedApps);
        console.log('Recent grants updated:', approvedApps.length, 'approved applications found out of', formattedApps.length, 'total applications'); // Debug log
      } else {
        setMessage('当前账户没有查看申请的权限');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setMessage('加载数据失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 审核申请
  const handleReviewApplication = async (applicationId: number, status: number, notes: string = '') => {
    console.log('Attempting to review application ID:', applicationId, 'with status:', status, 'notes:', notes); // Debug log
    if (!isConnected) {
      const msg = '请先连接钱包';
      setMessage(msg);
      console.log('Review failed: Not connected'); // Debug log
      return;
    }

    if (!permissions?.isOwner && !permissions?.isManager) {
      const msg = '当前账户没有审核申请的权限';
      setMessage(msg);
      console.log('Review failed: No permission', permissions); // Debug log
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      console.log('Submitting review for application ID:', applicationId, 'with status:', status === 1 ? 'Approved' : 'Rejected'); // Debug log
      await web3Service.reviewApplication(applicationId, status, notes);
      setMessage('申请审核成功！');
      console.log('Review successful for application ID:', applicationId); // Debug log
      await loadData(); // 重新加载数据
      // 延迟刷新以确保用户余额数据同步
      setTimeout(() => {
        loadData();
        // 尝试获取最新的资金池余额
        updateDashboardData();
        setMessage('申请审核成功，数据已更新！如果用户余额未更新，请稍后刷新页面。');
        console.log('Delayed data refresh triggered to sync user balance and dashboard data.'); // Debug log
      }, 10000); // 延迟10秒以等待区块链交易确认
    } catch (error) {
      console.error('审核申请失败:', error);
      let detailedErrorMsg = '审核申请失败: ' + (error instanceof Error ? error.message : '未知错误');
      let userErrorMsg = '审核申请失败';
      if (error && typeof error === 'object' && 'reason' in error) {
        detailedErrorMsg += ` Reason: ${(error as any).reason}`;
        if ((error as any).reason.includes('Transfer failed')) {
          userErrorMsg += '：转账失败，可能是 Escrow 合约余额记录不正确或申请人地址无法接收资金。';
          detailedErrorMsg += '（转账失败，可能是 Escrow 合约余额记录（platformPool）与实际余额不一致，或申请人地址无法接收资金。请检查 Escrow 合约地址 0x719Be548a3499A9eB719C84F8720123f819bA43F 的实际余额和 platformPool 值，并确认申请人地址是否有效且可以接收 ETH。）';
        }
      }
      if (error && typeof error === 'object' && 'data' in error) {
        detailedErrorMsg += ` Data: ${(error as any).data}`;
      }
      setMessage(userErrorMsg + ' 请查看控制台日志了解详细信息。');
      console.log('Review failed with detailed error:', detailedErrorMsg); // Detailed debug log
    } finally {
      setLoading(false);
    }
  };

  // 更新仪表盘数据
  const updateDashboardData = async () => {
    try {
      // 假设 web3Service 有方法获取资金池余额
      // 注意：请根据实际 web3Service 接口调整此方法名
      // 例如：const poolBalance = await web3Service.getPlatformPool();
      console.log('Attempting to update dashboard data. Placeholder for platform pool balance.'); // Debug log
      // 这里可以添加更多仪表盘数据的更新逻辑，如本月拨款等
      // 例如：const monthlyGrants = await web3Service.getMonthlyGrants();
      // 更新相关状态
      // setPlatformPoolBalance(poolBalance);
      // setMonthlyGrants(monthlyGrants);
    } catch (error) {
      console.error('更新仪表盘数据失败:', error);
    }
  };

  // 获取用户信息
  const getUserInfo = (userId: number) => {
    return users.find(user => user.id === userId);
  };

  // 获取状态徽章
  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            待审核
          </span>
        )
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckIcon className="h-3 w-3 mr-1" />
            已批准
          </span>
        )
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XMarkIcon className="h-3 w-3 mr-1" />
            已拒绝
          </span>
        )
      default:
        return null
    }
  };

  // 过滤申请
  const filteredApplications = applications.filter(app => {
    const user = getUserInfo(app.userId);
    console.log(`Filtering application ID: ${app.id}, User found:`, user); // Debug log
    // 即使没有用户信息也显示申请
    if (!user) return true;
    
    return user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.userAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
           app.reason.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 统计数据
  const pendingCountState = applications.filter(app => app.status === 'pending').length;
  const approvedCountState = applications.filter(app => app.status === 'approved').length;
  const rejectedCountState = applications.filter(app => app.status === 'rejected').length;
  const totalAmountState = applications
    .filter(app => app.status === 'approved')
    .reduce((sum, app) => sum + parseFloat(app.amount.replace(' ETH', '')), 0);

  // 当连接状态改变时加载数据
  useEffect(() => {
    const loadApplications = async () => {
      try {
        console.log('Loading applications and permissions...'); // Debug log
        setLoading(true)
        
        // 检查权限
        const permissionsData = await web3Service.checkAdminPermissions()
        console.log('Permissions data:', permissionsData); // Debug log
        setPermissions(permissionsData)

        if (permissionsData.isOwner || permissionsData.isManager) {
          const [allApps, usersData] = await Promise.all([
            web3Service.getAllApplications(),
            web3Service.getAllUsers()
          ]);
          console.log('Raw applications data:', allApps); // Debug log
          console.log('Raw users data:', usersData); // Debug log
          setUsers(usersData);
          
          const formattedApps = allApps.map((app: { id: number, userId: number, amount: string, reason: string, status: number, appliedDate: string, processedDate: string, description: string, notes: string }) => {
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
            }
          })
          setApplications(formattedApps)
          console.log('Formatted applications:', formattedApps); // Debug log
          
          // 计算统计数据
          let pending = 0, approved = 0, rejected = 0, totalAmt = 0;
          formattedApps.forEach((app: { status: string, amount: string }) => {
            if (app.status === 'pending') pending++;
            else if (app.status === 'approved') {
              approved++;
              totalAmt += parseFloat(app.amount.replace(' ETH', ''));
            }
            else if (app.status === 'rejected') rejected++;
          });
          setPendingCount(pending);
          setApprovedCount(approved);
          setRejectedCount(rejected);
          setTotalAmount(totalAmt);
          console.log(`Statistics updated: Pending=${pending}, Approved=${approved}, Rejected=${rejected}, Total Amount=${totalAmt} ETH`); // Debug log
          
          // 计算最近拨款记录（假设最近5个已批准的申请）
          const approvedApps = formattedApps
            .filter((app: { status: string }) => app.status === 'approved')
            .sort((a: { id: number, processedDate: string, appliedDate: string }, b: { id: number, processedDate: string, appliedDate: string }) => {
              const dateA = a.processedDate ? new Date(a.processedDate).getTime() : (a.appliedDate ? new Date(a.appliedDate).getTime() : 0);
              const dateB = b.processedDate ? new Date(b.processedDate).getTime() : (b.appliedDate ? new Date(b.appliedDate).getTime() : 0);
              console.log(`Sorting grants: ID=${a.id}, DateA=${dateA}, ID=${b.id}, DateB=${dateB}`); // Debug log
              return dateB - dateA;
            })
            .slice(0, 5);
          setRecentGrants(approvedApps);
          console.log('Recent grants updated:', approvedApps.length, 'approved applications found out of', formattedApps.length, 'total applications'); // Debug log
        } else {
          setMessage('当前账户没有查看申请的权限')
        }
      } catch (error) {
        console.error('加载申请数据失败:', error)
        setMessage('加载申请数据失败: ' + (error instanceof Error ? error.message : '未知错误'))
      } finally {
        setLoading(false)
      }
    }

    if (isConnected) {
      loadApplications()
      // 移除 loadDisputes 和 loadDisputeTeam 调用
      // loadDisputes();
      // loadDisputeTeam();
    } else {
      setMessage('请先连接钱包')
    }
  }, [isConnected])

  // 移除 handleJoinDisputeTeam 和 handleVote 函数
  // const handleJoinDisputeTeam = () => { ... };
  // const handleVote = (disputeId: number, voteFor: boolean) => { ... };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">拨款管理</h2>
        <p className="text-gray-600">请连接钱包以查看和管理拨款申请</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="slide-in-up">
          <h2 className="text-2xl font-bold text-gray-900">拨款管理</h2>
          <p className="text-gray-600">查看和管理所有拨款申请</p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (message && message.includes('权限')) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">权限不足</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="slide-in-up">
        <h2 className="text-2xl font-bold text-gray-900">拨款管理</h2>
        <p className="text-gray-600">审核和管理用户拨款申请</p>
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
              {/* 移除争议处理团队状态显示 */}
              {/* <span className={`flex items-center ${disputeTeam.some(member => member.id === 'currentUser') ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${disputeTeam.some(member => member.id === 'currentUser') ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                争议处理团队: {disputeTeam.some(member => member.id === 'currentUser') ? '是' : '否'}
              </span> */}
              {/* 移除加入团队按钮 */}
              {/* <button
                onClick={() => setShowJoinTeamModal(true)}
                className="text-blue-600 hover:text-blue-900 hover-glow button-press"
                title="加入争议处理团队"
              >
                加入团队
              </button> */}
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

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card card-hover scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500 hover-glow">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">待审核申请</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="card card-hover scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500 hover-glow">
              <CheckIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">已批准申请</p>
              <p className="text-2xl font-semibold text-gray-900">{approvedCount}</p>
            </div>
          </div>
        </div>
        <div className="card card-hover scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500 hover-glow">
              <XMarkIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">已拒绝申请</p>
              <p className="text-2xl font-semibold text-gray-900">{rejectedCount}</p>
            </div>
          </div>
        </div>
        <div className="card card-hover scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500 hover-glow">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总拨款金额</p>
              <p className="text-2xl font-semibold text-gray-900">{totalAmount.toFixed(2)} ETH</p>
            </div>
          </div>
        </div>
      </div>

      {/* 移除加入争议处理团队模态框 */}
      {/* {showJoinTeamModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h2 className="text-xl font-bold mb-4">加入争议处理团队</h2>
            <p className="text-gray-600 mb-4">通过为平台资金池捐款，您可以成为争议处理团队的一员，参与争议投票。</p>
            <form onSubmit={(e) => { e.preventDefault(); handleJoinDisputeTeam(); }}>
              <div className="mb-4">
                <label htmlFor="donationAmount" className="block text-sm font-medium text-gray-700 mb-1">捐款金额 (ETH)</label>
                <input
                  type="number"
                  id="donationAmount"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="input-field"
                  placeholder="请输入捐款金额"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowJoinTeamModal(false)} className="btn btn-secondary">取消</button>
                <button type="submit" className="btn btn-primary">确认加入</button>
              </div>
            </form>
          </div>
        </div>
      )} */}

      {/* 最近拨款记录 */}
      <div className="card slide-in-right mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">最近拨款记录</h3>
        {recentGrants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">批准日期</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentGrants.map((app: any, index: number) => {
                  const user = getUserInfo(app.userId);
                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors duration-200" style={{ animationDelay: `${index * 0.05}s` }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{app.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user?.userName || '未知用户'}</div>
                        <div className="text-sm text-gray-500 font-mono">{formatAddress(user?.userAddress || '')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={app.reason}>
                          {app.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.processedDate || '未知日期'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            暂无最近拨款记录。可能是没有已批准的申请或数据未同步。
          </div>
        )}
      </div>
      
      {/* 移除原来的争议记录部分，替换为 DisputePanel 组件 */}
      {/* <div className="card slide-in-right mt-6"> ... </div> */}
      {/* 使用独立的 DisputePanel 组件 */}
      <DisputePanel />

      {/* 搜索栏 */}
      <div className="card slide-in-left">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户名、地址或申请原因..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 hover-glow"
          />
        </div>
      </div>

      {/* 申请列表 */}
      <div className="card slide-in-right">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((app, index) => {
                  const user = getUserInfo(app.userId);
                  console.log(`Rendering application ID: ${app.id}, Status: ${app.status}, Permission to review:`, { isOwner: permissions?.isOwner, isManager: permissions?.isManager }); // Debug log
                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors duration-200" style={{ animationDelay: `${index * 0.05}s` }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{app.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user?.userName || '未知用户'}</div>
                        <div className="text-sm text-gray-500 font-mono">{formatAddress(user?.userAddress || '')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatAmount(app.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={app.reason}>
                          {app.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(app.appliedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {app.status === 'pending' && (permissions?.isOwner || permissions?.isManager) ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleReviewApplication(app.id, 1)}
                              disabled={loading}
                              className="text-green-600 hover:text-green-900 hover-glow button-press disabled:opacity-50"
                              title="批准申请"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReviewApplication(app.id, 2)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900 hover-glow button-press disabled:opacity-50"
                              title="拒绝申请"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500">{app.status === 'approved' ? '已批准' : app.status === 'rejected' ? '已拒绝' : '无操作权限'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredApplications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? '没有找到匹配的申请' : '暂无申请数据'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 
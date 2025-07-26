import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { web3Service } from '../services/web3Service';
import { CheckIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatAddress } from '../services/web3Service';

// 假设的接口，实际项目中应根据需要调整
export interface User {
  id: number;
  userAddress: string;
  userName: string;
  isActive: boolean;
  registeredAt: string;
}

export interface Dispute {
  id: number;
  applicationId: number;
  status: string;
  votesFor: number;
  votesAgainst: number;
  initiatedDate: string;
  finalResult?: string;
  votedUsers?: { userId: string, voteFor: boolean }[];
}

export default function DisputePanel() {
  const { isConnected } = useWeb3();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputeTeam, setDisputeTeam] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showJoinTeamModal, setShowJoinTeamModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [permissions, setPermissions] = useState<any>(null);

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

  // 加载争议处理团队从本地存储
  const loadDisputeTeam = () => {
    const storedTeam = localStorage.getItem('disputeTeam');
    if (storedTeam) {
      setDisputeTeam(JSON.parse(storedTeam));
      console.log('Loaded dispute team from local storage:', JSON.parse(storedTeam)); // Debug log
    } else {
      setDisputeTeam([]);
      console.log('No dispute team found in local storage'); // Debug log
    }
  };

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading data for DisputePanel...'); // Debug log
        
        // 检查权限
        const permissionsData = await web3Service.checkAdminPermissions();
        console.log('Permissions data:', permissionsData); // Debug log
        setPermissions(permissionsData);

        if (permissionsData.isOwner || permissionsData.isManager) {
          const [allApps, usersData] = await Promise.all([
            web3Service.getAllApplications(),
            web3Service.getAllUsers()
          ]);
          console.log('Raw applications data:', allApps); // Debug log
          console.log('Raw users data:', usersData); // Debug log
          setUsers(usersData);
          setApplications(allApps);
        } else {
          setMessage('当前账户没有查看数据的权限');
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        setMessage('加载数据失败: ' + (error instanceof Error ? error.message : '未知错误'));
      } finally {
        setLoading(false);
      }
    };

    if (isConnected) {
      loadData();
      loadDisputes();
      loadDisputeTeam();
    } else {
      setMessage('请先连接钱包');
    }

    // 设置定时刷新，每30秒刷新一次争议记录
    const intervalId = setInterval(() => {
      loadDisputes();
      loadDisputeTeam();
      console.log('Auto-refreshed disputes and team data from local storage'); // Debug log
    }, 30000);

    // 清理定时器
    return () => clearInterval(intervalId);
  }, [isConnected]);

  // 手动刷新数据
  const handleRefresh = () => {
    loadDisputes();
    loadDisputeTeam();
    setMessage('数据已刷新');
    console.log('Manually refreshed disputes and team data from local storage'); // Debug log
  };

  // 加入争议处理团队
  const handleJoinDisputeTeam = () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      setMessage('请输入有效的捐款金额');
      return;
    }
    const amount = parseFloat(donationAmount);
    // 模拟加入团队 - 本地数据
    const currentUser = { id: 'currentUser', name: '当前用户', address: '0xCurrentUserAddress' }; // 模拟当前用户信息
    const updatedTeam = [...disputeTeam, { ...currentUser, donation: amount }];
    setDisputeTeam(updatedTeam);
    // 保存到本地存储
    localStorage.setItem('disputeTeam', JSON.stringify(updatedTeam));
    setMessage(`成功加入争议处理团队！捐款金额：${amount} ETH`);
    setDonationAmount('');
    setShowJoinTeamModal(false);
    console.log('User joined dispute team with donation:', amount); // Debug log
  };

  // 处理投票
  const handleVote = (disputeId: number, voteFor: boolean) => {
    if (!disputeTeam.some(member => member.id === 'currentUser')) {
      setMessage('您不是争议处理团队成员，无法投票');
      return;
    }

    const currentUserId = 'currentUser'; // 模拟当前用户ID
    const updatedDisputes = disputes.map(dispute => {
      if (dispute.id === disputeId && dispute.status === 'ongoing') {
        // 检查用户是否已经投票
        const votedUsers = dispute.votedUsers || [];
        if (votedUsers.some(user => user.userId === currentUserId)) {
          setMessage('您已经对该争议投过票，无法重复投票');
          console.log(`User ${currentUserId} has already voted on dispute ID=${disputeId}`); // Debug log
          return dispute;
        }

        const newVotesFor = voteFor ? dispute.votesFor + 1 : dispute.votesFor;
        const newVotesAgainst = !voteFor ? dispute.votesAgainst + 1 : dispute.votesAgainst;
        const totalVotes = newVotesFor + newVotesAgainst;
        const maxVotes = 5; // 假设最大票数为5，达到后结束投票
        const updatedVotedUsers = [...votedUsers, { userId: currentUserId, voteFor }];

        if (totalVotes >= maxVotes) {
          const finalStatus = newVotesFor > newVotesAgainst ? 'approved' : 'rejected';
          // 更新争议状态
          const updatedDispute = {
            ...dispute,
            votesFor: newVotesFor,
            votesAgainst: newVotesAgainst,
            status: 'completed',
            finalResult: finalStatus,
            votedUsers: updatedVotedUsers
          };
          // 更新申请状态（本地模拟）
          if (finalStatus === 'approved') {
            const updatedApps = applications.map(app => {
              if (app.id === dispute.applicationId) {
                return { ...app, status: 1, processedDate: new Date().toLocaleDateString() };
              }
              return app;
            });
            setApplications(updatedApps);
            console.log(`Application ID=${dispute.applicationId} status updated to approved after dispute voting`); // Debug log
          }
          return updatedDispute;
        }
        return {
          ...dispute,
          votesFor: newVotesFor,
          votesAgainst: newVotesAgainst,
          votedUsers: updatedVotedUsers
        };
      }
      return dispute;
    });

    setDisputes(updatedDisputes);
    // 保存到本地存储
    const serializedDisputes = JSON.stringify(updatedDisputes, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    localStorage.setItem('disputes', serializedDisputes);
    setMessage(`投票成功！您${voteFor ? '支持' : '反对'}了争议 #${disputeId}`);
    console.log(`Vote recorded for dispute ID=${disputeId}, Vote for=${voteFor}`); // Debug log
  };

  // 获取用户信息
  const getUserInfo = (userId: number) => {
    return users.find(user => user.id === userId);
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
        <h2 className="text-2xl font-bold text-gray-900">争议处理</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowJoinTeamModal(true)}
            className="btn btn-primary"
          >
            加入争议处理团队
          </button>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary flex items-center"
            title="刷新数据"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            刷新
          </button>
        </div>
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
              <span className={`flex items-center ${disputeTeam.some(member => member.id === 'currentUser') ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${disputeTeam.some(member => member.id === 'currentUser') ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                争议处理团队: {disputeTeam.some(member => member.id === 'currentUser') ? '是' : '否'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 消息提示 */}
      {message && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm" role="alert">
          {message}
        </div>
      )}

      {/* 加入争议处理团队模态框 */}
      {showJoinTeamModal && (
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
      )}

      {/* 争议记录 */}
      <div className="card slide-in-right">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">争议历史记录</h3>
        {disputes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">争议ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">投票结果</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发起日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {disputes.map((dispute, index) => {
                  const app = applications.find(a => a.id === dispute.applicationId);
                  const user = app ? getUserInfo(app.userId) : null;
                  const votedUsers = dispute.votedUsers || [];
                  const hasVoted = votedUsers.some(vu => vu.userId === 'currentUser');
                  return (
                    <tr key={dispute.id} className="hover:bg-gray-50 transition-colors duration-200" style={{ animationDelay: `${index * 0.05}s` }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{dispute.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{dispute.applicationId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user?.userName || '未知用户'}</div>
                        <div className="text-sm text-gray-500 font-mono">{formatAddress(user?.userAddress || '')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dispute.status === 'ongoing' ? '进行中' : '已结束'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">支持: {dispute.votesFor}, 反对: {dispute.votesAgainst}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dispute.initiatedDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {dispute.status === 'ongoing' && disputeTeam.some(member => member.id === 'currentUser') && !hasVoted ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleVote(dispute.id, true)}
                              disabled={loading}
                              className="text-green-600 hover:text-green-900 hover-glow button-press disabled:opacity-50"
                              title="支持"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleVote(dispute.id, false)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900 hover-glow button-press disabled:opacity-50"
                              title="反对"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500">{dispute.status === 'completed' ? '投票已结束' : hasVoted ? '已投票' : '无投票权限'}</span>
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
            暂无争议记录
          </div>
        )}
      </div>
    </div>
  );
} 
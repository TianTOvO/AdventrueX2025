'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { web3Service, getEnumText, formatEther, formatAmount } from '../services/web3Service';
import DebugInfo from './DebugInfo';
import NetworkTest from './NetworkTest';
import SimpleTest from './SimpleTest';

interface User {
  userName: string;
  id: number;
  userAge: number;
  userAddress: string;
  userAreaLevel: number;
  userHealthStatus: number;
}

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

export default function ContractInteraction() {
  const { isConnected } = useWeb3();
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [poolBalance, setPoolBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [permissions, setPermissions] = useState<{ isOwner: boolean; isManager: boolean; isFirstManager: boolean } | null>(null);
  const [contractInfo, setContractInfo] = useState<{ owner: string; firstManager: string; escrow: string } | null>(null);

  // 表单状态
  const [newUser, setNewUser] = useState({
    name: '',
    age: '',
    address: '',
    areaLevel: 0,
    healthStatus: 0
  });

  const [newApplication, setNewApplication] = useState({
    userId: '',
    amount: '',
    reason: '',
    description: ''
  });

  // 加载数据
  const loadData = async () => {
    if (!isConnected) return;

    try {
      setLoading(true);
      setMessage('');
      
      // 首先检查权限
      const [permissionsData, contractInfoData] = await Promise.all([
        web3Service.checkAdminPermissions(),
        web3Service.getContractInfo()
      ]);
      
      setPermissions(permissionsData);
      setContractInfo(contractInfoData);
      
      // 如果有权限，加载数据
      if (permissionsData.isOwner || permissionsData.isManager) {
        try {
          const [usersData, applicationsData, balanceData] = await Promise.all([
            web3Service.getAllUsers(),
            web3Service.getAllApplications(),
            web3Service.getPlatformPool()
          ]);

          setUsers(usersData);
          setApplications(applicationsData);
          setPoolBalance(balanceData);
        } catch (dataError) {
          console.error('加载数据失败:', dataError);
          setMessage('加载数据失败: ' + (dataError instanceof Error ? dataError.message : '未知错误'));
        }
      } else {
        setMessage('当前账户没有管理员权限，只能查看合约信息');
      }
    } catch (error) {
      console.error('权限检查失败:', error);
      setMessage('权限检查失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 添加用户
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setMessage('请先连接钱包');
      return;
    }

    if (!permissions?.isOwner && !permissions?.isManager) {
      setMessage('当前账户没有添加用户的权限');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await web3Service.addUser(
        newUser.name,
        parseInt(newUser.age),
        newUser.address,
        newUser.areaLevel,
        newUser.healthStatus
      );

      setMessage('用户添加成功！');
      setNewUser({ name: '', age: '', address: '', areaLevel: 0, healthStatus: 0 });
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('添加用户失败:', error);
      setMessage('添加用户失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 提交申请
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setMessage('请先连接钱包');
      return;
    }

    if (!permissions?.isOwner && !permissions?.isManager) {
      setMessage('当前账户没有提交申请的权限');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await web3Service.submitApplication(
        parseInt(newApplication.userId),
        parseFloat(newApplication.amount),
        newApplication.reason,
        newApplication.description
      );

      setMessage('申请提交成功！');
      setNewApplication({ userId: '', amount: '', reason: '', description: '' });
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('提交申请失败:', error);
      setMessage('提交申请失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 审核申请
  const handleReviewApplication = async (applicationId: number, status: number) => {
    if (!isConnected) {
      setMessage('请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await web3Service.reviewApplication(
        applicationId,
        status,
        status === 1 ? '申请通过' : '申请被拒绝'
      );

      setMessage('审核完成！');
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('审核失败:', error);
      setMessage('审核失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 添加资金到池
  const handleAddFunds = async (amount: string) => {
    if (!isConnected) {
      setMessage('请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await web3Service.addFunds(parseFloat(amount));
      setMessage('资金添加成功！');
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('添加资金失败:', error);
      setMessage('添加资金失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (isConnected) {
      loadData();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">需要连接钱包</h2>
          <p className="text-yellow-700">请先连接MetaMask钱包以使用合约功能。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 调试信息 */}
      <DebugInfo />
      
      {/* 网络测试 */}
      <NetworkTest />
      
      {/* 基础功能测试 */}
      <SimpleTest />
      
      {/* 权限信息 */}
      {permissions && contractInfo && (
        <div className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">合约权限信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">当前账户权限</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${permissions.isOwner ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm">合约所有者: {permissions.isOwner ? '是' : '否'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${permissions.isManager ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm">管理员: {permissions.isManager ? '是' : '否'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">合约信息</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">所有者地址:</span>
                    <p className="text-gray-600 break-all">{contractInfo.owner}</p>
                  </div>
                  <div>
                    <span className="font-medium">管理员地址:</span>
                    <p className="text-gray-600 break-all">{contractInfo.firstManager}</p>
                  </div>
                  <div>
                    <span className="font-medium">托管合约地址:</span>
                    <p className="text-gray-600 break-all">{contractInfo.escrow}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 状态信息 */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">用户总数</h3>
            <p className="text-3xl font-bold text-blue-600">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">申请总数</h3>
            <p className="text-3xl font-bold text-green-600">{applications.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">资金池余额</h3>
            <p className="text-3xl font-bold text-purple-600">{poolBalance} ETH</p>
          </div>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('成功') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* 添加用户表单 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">添加新用户</h2>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
              <input
                type="number"
                value={newUser.age}
                onChange={(e) => setNewUser({ ...newUser, age: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">钱包地址</label>
              <input
                type="text"
                value={newUser.address}
                onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">地区层级</label>
              <select
                value={newUser.areaLevel}
                onChange={(e) => setNewUser({ ...newUser, areaLevel: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>城市</option>
                <option value={1}>区县</option>
                <option value={2}>乡村</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">健康状态</label>
              <select
                value={newUser.healthStatus}
                onChange={(e) => setNewUser({ ...newUser, healthStatus: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>健康</option>
                <option value={1}>病态</option>
                <option value={2}>危急</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '添加中...' : '添加用户'}
          </button>
        </form>
      </div>

      {/* 提交申请表单 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">提交拨款申请</h2>
        <form onSubmit={handleSubmitApplication} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户ID</label>
              <input
                type="number"
                value={newApplication.userId}
                onChange={(e) => setNewApplication({ ...newApplication, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">申请金额 (ETH)</label>
              <input
                type="number"
                step="0.01"
                value={newApplication.amount}
                onChange={(e) => setNewApplication({ ...newApplication, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">申请原因</label>
              <input
                type="text"
                value={newApplication.reason}
                onChange={(e) => setNewApplication({ ...newApplication, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
              <textarea
                value={newApplication.description}
                onChange={(e) => setNewApplication({ ...newApplication, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '提交中...' : '提交申请'}
          </button>
        </form>
      </div>

      {/* 添加资金 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">添加资金到池</h2>
        <div className="flex gap-4">
          <input
            type="number"
            step="0.01"
            placeholder="输入金额 (ETH)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="fundAmount"
          />
          <button
            onClick={() => {
              const amount = (document.getElementById('fundAmount') as HTMLInputElement).value;
              if (amount) handleAddFunds(amount);
            }}
            disabled={loading}
            className="bg-purple-600 text-white py-2 px-6 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '添加中...' : '添加资金'}
          </button>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">用户列表</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年龄</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地址</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地区</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">健康状态</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.userAge}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.userAddress}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getEnumText('AreaLevel', user.userAreaLevel)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getEnumText('HealthStatus', user.userHealthStatus)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 申请列表 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">申请列表</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.userId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatAmount(app.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      app.status === 0 ? 'bg-yellow-100 text-yellow-800' :
                      app.status === 1 ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getEnumText('ApplicationStatus', app.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {app.status === 0 && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReviewApplication(app.id, 1)}
                          disabled={loading}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          通过
                        </button>
                        <button
                          onClick={() => handleReviewApplication(app.id, 2)}
                          disabled={loading}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          拒绝
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
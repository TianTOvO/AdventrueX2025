'use client'

import React, { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useWeb3 } from '../contexts/Web3Context'
import { web3Service, getEnumText, formatAddress, formatAmount } from '../services/web3Service'

interface User {
  id: number;
  userName: string;
  userAge: number;
  userAddress: string;
  userAreaLevel: number;
  userHealthStatus: number;
}

export default function UserManagement() {
  const { isConnected } = useWeb3();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [permissions, setPermissions] = useState<{ isOwner: boolean; isManager: boolean; isFirstManager: boolean } | null>(null);

  // 新用户表单状态
  const [newUser, setNewUser] = useState({
    name: '',
    age: '',
    address: '',
    areaLevel: 0,
    healthStatus: 0
  });

  // 加载用户数据
  const loadUsers = async () => {
    if (!isConnected) return;

    try {
      setLoading(true);
      setMessage('');

      // 检查权限
      const permissionsData = await web3Service.checkAdminPermissions();
      setPermissions(permissionsData);

      if (permissionsData.isOwner || permissionsData.isManager) {
        const usersData = await web3Service.getAllUsers();
        setUsers(usersData);
      } else {
        setMessage('当前账户没有查看用户的权限');
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      setMessage('加载用户数据失败: ' + (error instanceof Error ? error.message : '未知错误'));
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
      setShowAddModal(false);
      await loadUsers(); // 重新加载数据
    } catch (error) {
      console.error('添加用户失败:', error);
      setMessage('添加用户失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: number) => {
    if (!isConnected) {
      setMessage('请先连接钱包');
      return;
    }

    if (!permissions?.isOwner && !permissions?.isManager) {
      setMessage('当前账户没有删除用户的权限');
      return;
    }

    if (!confirm('确定要删除这个用户吗？此操作不可撤销。')) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await web3Service.deleteUser(userId);
      setMessage('用户删除成功！');
      await loadUsers(); // 重新加载数据
    } catch (error) {
      console.error('删除用户失败:', error);
      setMessage('删除用户失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 获取用户余额
  const getUserBalance = async (userId: number) => {
    try {
      const balance = await web3Service.getUserBalance(userId);
      return balance;
    } catch (error) {
      console.error('获取用户余额失败:', error);
      return '0';
    }
  };

  // 过滤用户
  const filteredUsers = users.filter(user =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 当连接状态改变时加载数据
  useEffect(() => {
    if (isConnected) {
      loadUsers();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="card slide-in-up">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">需要连接钱包</h2>
            <p className="text-yellow-700">请先连接MetaMask钱包以查看用户管理功能。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center slide-in-up">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">用户管理</h2>
          <p className="text-gray-600">管理平台注册用户信息</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          disabled={loading || (!permissions?.isOwner && !permissions?.isManager)}
          className="btn-primary flex items-center button-press hover-glow bounce-in disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          添加用户
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

      {/* 搜索栏 */}
      <div className="card slide-in-left">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户名或地址..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 hover-glow"
          />
        </div>
      </div>

      {/* 用户列表 */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    年龄
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    钱包地址
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    地区层级
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    健康状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200" style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.userAge}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">{formatAddress(user.userAddress)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getEnumText('AreaLevel', user.userAreaLevel)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.userHealthStatus === 0 ? 'status-healthy' :
                        user.userHealthStatus === 1 ? 'status-sick' : 'status-critical'
                      }`}>
                        {getEnumText('HealthStatus', user.userHealthStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={loading || (!permissions?.isOwner && !permissions?.isManager)}
                          className="text-red-600 hover:text-red-900 hover-glow button-press disabled:opacity-50 disabled:cursor-not-allowed"
                          title="删除用户"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? '没有找到匹配的用户' : '暂无用户数据'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 添加用户模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 fade-in">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white scale-in">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 slide-in-up">添加新用户</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">姓名</label>
                  <input 
                    type="text" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="input-field" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">年龄</label>
                  <input 
                    type="number" 
                    value={newUser.age}
                    onChange={(e) => setNewUser({ ...newUser, age: e.target.value })}
                    className="input-field" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">钱包地址</label>
                  <input 
                    type="text" 
                    value={newUser.address}
                    onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                    className="input-field" 
                    placeholder="0x..." 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">地区层级</label>
                  <select 
                    value={newUser.areaLevel}
                    onChange={(e) => setNewUser({ ...newUser, areaLevel: parseInt(e.target.value) })}
                    className="input-field"
                  >
                    <option value={0}>城市</option>
                    <option value={1}>区县</option>
                    <option value={2}>乡村</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">健康状态</label>
                  <select 
                    value={newUser.healthStatus}
                    onChange={(e) => setNewUser({ ...newUser, healthStatus: parseInt(e.target.value) })}
                    className="input-field"
                  >
                    <option value={0}>健康</option>
                    <option value={1}>病态</option>
                    <option value={2}>危急</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)} 
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
                    {loading ? '添加中...' : '添加用户'}
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
import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

export default function DebugInfo() {
  const { isConnected, account, network, isLoading, error } = useWeb3();

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">调试信息</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">连接状态:</span> 
          <span className={`ml-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? '已连接' : '未连接'}
          </span>
        </div>
        <div>
          <span className="font-medium">加载状态:</span> 
          <span className={`ml-2 ${isLoading ? 'text-yellow-600' : 'text-gray-600'}`}>
            {isLoading ? '加载中' : '已完成'}
          </span>
        </div>
        <div>
          <span className="font-medium">账户地址:</span> 
          <span className="ml-2 text-gray-600 break-all">
            {account || '未连接'}
          </span>
        </div>
        <div>
          <span className="font-medium">网络信息:</span> 
          <span className="ml-2 text-gray-600">
            {network ? `Chain ID: ${network.chainId}` : '未知'}
          </span>
        </div>
        {error && (
          <div>
            <span className="font-medium text-red-600">错误信息:</span> 
            <span className="ml-2 text-red-600">{error}</span>
          </div>
        )}
        <div>
          <span className="font-medium">MetaMask状态:</span> 
          <span className={`ml-2 ${typeof window !== 'undefined' && window.ethereum ? 'text-green-600' : 'text-red-600'}`}>
            {typeof window !== 'undefined' && window.ethereum ? '已安装' : '未安装'}
          </span>
        </div>
      </div>
    </div>
  );
} 
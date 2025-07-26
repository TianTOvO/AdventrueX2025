import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { web3Service } from '../services/web3Service';

export default function SimpleTest() {
  const { isConnected, account } = useWeb3();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runBasicTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      // 测试1: 检查连接状态
      addResult(`连接状态: ${isConnected ? '已连接' : '未连接'}`);
      
      if (!isConnected) {
        addResult('❌ 请先连接钱包');
        return;
      }
      
      // 测试2: 检查账户
      addResult(`当前账户: ${account}`);
      
      // 测试3: 检查网络
      try {
        const network = await web3Service.getNetwork();
        addResult(`网络信息: Chain ID ${network.chainId}`);
        
        if (network.chainId !== BigInt(1439)) {
          addResult('⚠️ 警告: 未连接到Injective测试网 (Chain ID: 1439)');
        } else {
          addResult('✅ 已连接到Injective测试网');
        }
      } catch (error) {
        addResult(`❌ 获取网络信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      
      // 测试4: 检查合约权限
      try {
        const permissions = await web3Service.checkAdminPermissions();
        addResult(`权限检查: 所有者=${permissions.isOwner}, 管理员=${permissions.isManager}`);
      } catch (error) {
        addResult(`❌ 权限检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      
      // 测试5: 检查合约信息
      try {
        const contractInfo = await web3Service.getContractInfo();
        addResult(`合约所有者: ${contractInfo.owner}`);
        addResult(`合约管理员: ${contractInfo.firstManager}`);
      } catch (error) {
        addResult(`❌ 获取合约信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      
      // 测试6: 尝试获取用户数量
      try {
        const users = await web3Service.getAllUsers();
        addResult(`用户数量: ${users.length}`);
      } catch (error) {
        addResult(`❌ 获取用户列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      
      // 测试7: 尝试获取申请数量
      try {
        const applications = await web3Service.getAllApplications();
        addResult(`申请数量: ${applications.length}`);
      } catch (error) {
        addResult(`❌ 获取申请列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      
      // 测试8: 尝试获取资金池余额
      try {
        const balance = await web3Service.getPlatformPool();
        addResult(`资金池余额: ${balance} ETH`);
      } catch (error) {
        addResult(`❌ 获取资金池余额失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      
    } catch (error) {
      addResult(`❌ 测试过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">基础功能测试</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={runBasicTests}
            disabled={isTesting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isTesting ? '测试中...' : '运行基础测试'}
          </button>
          
          <button
            onClick={clearResults}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            清除结果
          </button>
        </div>
        
        {testResults.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">测试结果:</h3>
            <div className="space-y-1 text-sm">
              {testResults.map((result, index) => (
                <div key={index} className="font-mono">{result}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
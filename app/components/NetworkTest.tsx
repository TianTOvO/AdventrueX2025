import React, { useState } from 'react';
import { ethers } from 'ethers';

export default function NetworkTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testInjectiveConnection = async () => {
    setIsTesting(true);
    setTestResult('测试中...');
    
    try {
      // 测试Injective测试网连接
      const provider = new ethers.JsonRpcProvider('https://k8s.testnet.json-rpc.injective.network/');
      
      // 获取最新区块
      const blockNumber = await provider.getBlockNumber();
      setTestResult(`✅ 连接成功！最新区块: ${blockNumber}`);
      
      // 测试合约地址
      const proxyAddress = '0xf3007729f70233d29f8c5Cb38975a6c329945211';
      const code = await provider.getCode(proxyAddress);
      
      if (code === '0x') {
        setTestResult(prev => prev + '\n❌ 合约地址无效或合约不存在');
      } else {
        setTestResult(prev => prev + '\n✅ 合约地址有效');
      }
      
    } catch (error) {
      setTestResult(`❌ 连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testMetaMaskConnection = async () => {
    setIsTesting(true);
    setTestResult('测试MetaMask连接...');
    
    try {
      if (typeof window.ethereum === 'undefined') {
        setTestResult('❌ MetaMask未安装');
        return;
      }

      // 请求连接
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setTestResult(`✅ MetaMask连接成功！账户: ${accounts[0]}`);
        
        // 获取网络信息
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setTestResult(prev => prev + `\n当前网络Chain ID: ${chainId}`);
        
        if (chainId === '0x59f') { // 1439 in hex
          setTestResult(prev => prev + '\n✅ 已连接到Injective测试网');
        } else {
          setTestResult(prev => prev + '\n⚠️ 未连接到Injective测试网，请切换网络');
        }
      } else {
        setTestResult('❌ 用户拒绝连接');
      }
      
    } catch (error) {
      setTestResult(`❌ MetaMask连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">网络连接测试</h2>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={testInjectiveConnection}
            disabled={isTesting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 mr-4"
          >
            测试Injective连接
          </button>
          
          <button
            onClick={testMetaMaskConnection}
            disabled={isTesting}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            测试MetaMask连接
          </button>
        </div>
        
        {testResult && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">测试结果:</h3>
            <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 
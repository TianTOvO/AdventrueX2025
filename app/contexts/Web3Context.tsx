'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { web3Service, getEnumText, formatAddress, formatEther } from '../services/web3Service';

// Web3状态接口
interface Web3State {
  isConnected: boolean;
  account: string | null;
  network: any | null;
  isLoading: boolean;
  error: string | null;
}

// Web3上下文接口
interface Web3ContextType extends Web3State {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshData: () => Promise<void>;
}

// 创建上下文
const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Web3提供者组件
export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<Web3State>({
    isConnected: false,
    account: null,
    network: null,
    isLoading: false,
    error: null,
  });

  // 连接钱包
  const connect = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await web3Service.initialize();
      const account = await web3Service.getCurrentAccount();
      const network = await web3Service.getNetwork();
      
      setState({
        isConnected: true,
        account,
        network,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('连接失败:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '连接失败',
      }));
    }
  };

  // 断开连接
  const disconnect = () => {
    setState({
      isConnected: false,
      account: null,
      network: null,
      isLoading: false,
      error: null,
    });
  };

  // 刷新数据
  const refreshData = async () => {
    if (state.isConnected) {
      try {
        const account = await web3Service.getCurrentAccount();
        const network = await web3Service.getNetwork();
        
        setState(prev => ({
          ...prev,
          account,
          network,
        }));
      } catch (error) {
        console.error('刷新数据失败:', error);
        // 如果刷新失败，可能是连接断开
        disconnect();
      }
    }
  };

  // 监听账户变化
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // 用户断开了连接
          disconnect();
        } else {
          // 账户切换
          setState(prev => ({ ...prev, account: accounts[0] }));
        }
      };

      const handleChainChanged = () => {
        // 网络切换，刷新页面
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // 自动连接（如果之前连接过）
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          console.log('Attempting auto-connect...'); // Debug log
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connect();
            console.log('Auto-connect successful, accounts:', accounts); // Debug log
          } else {
            console.log('No accounts found for auto-connect.'); // Debug log
          }
        } catch (error) {
          console.error('自动连接失败:', error);
        }
      } else {
        console.log('Ethereum provider not found.'); // Debug log
      }
    };

    autoConnect();
  }, []);

  const value: Web3ContextType = {
    ...state,
    connect,
    disconnect,
    refreshData,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// 使用Web3上下文的Hook
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3必须在Web3Provider内部使用');
  }
  return context;
};

// 连接钱包按钮组件
export const ConnectWalletButton: React.FC = () => {
  const { isConnected, account, isLoading, error, connect, disconnect } = useWeb3();

  if (isLoading) {
    return (
      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg opacity-50 cursor-not-allowed">
        连接中...
      </button>
    );
  }

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {formatAddress(account)}
        </span>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          断开连接
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={connect}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        连接钱包
      </button>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

// 网络信息组件
export const NetworkInfo: React.FC = () => {
  const { network, isConnected } = useWeb3();

  if (!isConnected || !network) {
    return null;
  }

  return (
    <div className="text-sm text-gray-600">
      网络: {network.name} (Chain ID: {network.chainId})
    </div>
  );
};

// 账户信息组件
export const AccountInfo: React.FC = () => {
  const { account, isConnected } = useWeb3();

  if (!isConnected || !account) {
    return null;
  }

  return (
    <div className="text-sm text-gray-600">
      账户: {formatAddress(account)}
    </div>
  );
}; 
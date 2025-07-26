import { ethers } from 'ethers';
import contractsConfig from '../../contracts/contracts.json';
import ProxyContractABI from '../../contracts/abis/ProxyContract.json';
import EscrowABI from '../../contracts/abis/Escrow.json';
import PoolManagerABI from '../../contracts/abis/PoolManager.json';

// 扩展Window接口以包含ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// 合约地址
const CONTRACT_ADDRESSES = {
  ProxyContract: contractsConfig.contracts.ProxyContract,
  Escrow: contractsConfig.contracts.Escrow,
  PoolManager: contractsConfig.contracts.PoolManager,
};

// Web3服务类
export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  
  // 合约实例
  private proxyContract: ethers.Contract | null = null;
  private escrowContract: ethers.Contract | null = null;
  private poolManagerContract: ethers.Contract | null = null;

  // 初始化Web3连接
  async initialize() {
    try {
      // 检查是否安装了MetaMask
      if (typeof window.ethereum === 'undefined') {
        throw new Error('请安装MetaMask钱包');
      }

      // 创建provider
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // 请求连接钱包
      await this.provider.send('eth_requestAccounts', []);
      
      // 检查网络
      const network = await this.provider.getNetwork();
      if (network.chainId !== BigInt(1439)) {
        // 尝试切换到Injective测试网
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x59F' }], // 1439 in hex
          });
        } catch (switchError: any) {
          // 如果网络不存在，添加网络
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x59F',
                chainName: 'Injective Testnet',
                nativeCurrency: {
                  name: 'INJ',
                  symbol: 'INJ',
                  decimals: 18
                },
                rpcUrls: ['https://k8s.testnet.json-rpc.injective.network/'],
                blockExplorerUrls: ['https://testnet.explorer.injective.network/']
              }]
            });
          } else {
            throw new Error('请手动切换到Injective测试网 (Chain ID: 1439)');
          }
        }
      }
      
      // 获取signer
      this.signer = await this.provider.getSigner();
      
      // 初始化合约实例
      this.initializeContracts();
      
      return true;
    } catch (error) {
      console.error('Web3初始化失败:', error);
      throw error;
    }
  }

  // 初始化合约实例
  private initializeContracts() {
    if (!this.signer) {
      throw new Error('Signer未初始化');
    }

    this.proxyContract = new ethers.Contract(
      CONTRACT_ADDRESSES.ProxyContract,
      ProxyContractABI,
      this.signer
    );

    this.escrowContract = new ethers.Contract(
      CONTRACT_ADDRESSES.Escrow,
      EscrowABI,
      this.signer
    );

    this.poolManagerContract = new ethers.Contract(
      CONTRACT_ADDRESSES.PoolManager,
      PoolManagerABI,
      this.signer
    );
  }

  // 获取当前账户地址
  async getCurrentAccount(): Promise<string> {
    if (!this.signer) {
      throw new Error('Web3未初始化');
    }
    return await this.signer.getAddress();
  }

  // 检查当前账户是否有管理员权限
  async checkAdminPermissions(): Promise<{ isOwner: boolean; isManager: boolean; isFirstManager: boolean }> {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }

    const currentAccount = await this.getCurrentAccount();
    const owner = await this.proxyContract.owner();
    const firstManager = await this.proxyContract.firstManager();
    
    return {
      isOwner: currentAccount.toLowerCase() === owner.toLowerCase(),
      isManager: currentAccount.toLowerCase() === firstManager.toLowerCase(),
      isFirstManager: currentAccount.toLowerCase() === firstManager.toLowerCase()
    };
  }

  // 获取合约所有者和管理员信息
  async getContractInfo() {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }

    const owner = await this.proxyContract.owner();
    const firstManager = await this.proxyContract.firstManager();
    const escrow = await this.proxyContract.escrow();
    
    return {
      owner,
      firstManager,
      escrow
    };
  }

  // 获取网络信息
  async getNetwork() {
    if (!this.provider) {
      throw new Error('Provider未初始化');
    }
    return await this.provider.getNetwork();
  }

  // ========== ProxyContract 相关方法 ==========

  // 添加用户
  async addUser(
    name: string,
    age: number,
    address: string,
    areaLevel: number,
    healthStatus: number
  ) {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }

    const tx = await this.proxyContract.addUser(
      name,
      age,
      address,
      areaLevel,
      healthStatus
    );
    return await tx.wait();
  }

  // 获取所有用户
  async getAllUsers() {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }
    return await this.proxyContract.getAllUsers();
  }

  // 获取用户信息
  async getUser(userId: number) {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }
    return await this.proxyContract.getUser(userId);
  }

  // 更新用户信息
  async updateUser(
    id: number,
    name: string,
    age: number,
    address: string,
    areaLevel: number,
    healthStatus: number
  ) {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }

    const tx = await this.proxyContract.updateUser(
      id,
      name,
      age,
      address,
      areaLevel,
      healthStatus
    );
    return await tx.wait();
  }

  // 删除用户
  async deleteUser(userId: number) {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }

    const tx = await this.proxyContract.deleteUser(userId);
    return await tx.wait();
  }

  // 提交拨款申请
  async submitApplication(
    userId: number,
    amount: number,
    reason: string,
    description: string
  ) {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }

    const tx = await this.proxyContract.submitApplication(
      userId,
      ethers.parseEther(amount.toString()),
      reason,
      description
    );
    return await tx.wait();
  }

  // 审核申请
  async reviewApplication(
    applicationId: number,
    status: number,
    notes: string
  ) {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }

    const tx = await this.proxyContract.reviewApplication(
      applicationId,
      status,
      notes
    );
    return await tx.wait();
  }

  // 获取所有申请
  async getAllApplications() {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }
    
    try {
      return await this.proxyContract.getAllApplications();
    } catch (error) {
      console.error('获取所有申请失败:', error);
      throw new Error(`获取所有申请失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 获取申请统计
  async getApplicationStats() {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }
    return await this.proxyContract.getApplicationStats();
  }

  // 获取用户申请
  async getUserApplications(userId: number) {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }
    
    try {
      // 获取用户的申请ID数组
      const applicationIds = await this.proxyContract.getUserApplications(userId);
      
      // 获取每个申请的详细信息
      const applications = [];
      for (let i = 0; i < applicationIds.length; i++) {
        const appId = applicationIds[i];
        if (appId > 0) {
          try {
            const application = await this.proxyContract.getApplication(appId);
            applications.push(application);
          } catch (error) {
            console.warn(`获取申请${appId}详情失败:`, error);
          }
        }
      }
      
      return applications;
    } catch (error) {
      console.error('获取用户申请失败:', error);
      throw new Error(`获取用户申请失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 获取用户统计
  async getUserStats(userId: number) {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }
    return await this.proxyContract.getUserStats(userId);
  }

  // 转账给用户
  async transferToUser(
    userAddress: string,
    amount: number,
    userId: number
  ) {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }

    const tx = await this.proxyContract.transferToUser(
      userAddress,
      ethers.parseEther(amount.toString()),
      userId,
      { value: ethers.parseEther(amount.toString()) }
    );
    return await tx.wait();
  }

  // 获取用户余额
  async getUserBalance(userId: number) {
    if (!this.proxyContract) {
      throw new Error('ProxyContract未初始化');
    }
    const balance = await this.proxyContract.getUserBalance(userId);
    return ethers.formatEther(balance);
  }

  // ========== Escrow 相关方法 ==========

  // 获取平台资金池余额
  async getPlatformPool() {
    if (!this.escrowContract) {
      throw new Error('EscrowContract未初始化');
    }
    const balance = await this.escrowContract.getPlatformPool();
    return ethers.formatEther(balance);
  }

  // 添加平台资金池
  async addPlatformPool(amount: number) {
    if (!this.escrowContract) {
      throw new Error('EscrowContract未初始化');
    }

    const tx = await this.escrowContract.addPlatformPool({
      value: ethers.parseEther(amount.toString())
    });
    return await tx.wait();
  }

  // 获取贡献者信息
  async getContributor(contributorAddress: string) {
    if (!this.escrowContract) {
      throw new Error('EscrowContract未初始化');
    }
    return await this.escrowContract.getContributor(contributorAddress);
  }

  // ========== PoolManager 相关方法 ==========

  // 获取资金池信息
  async getPoolInfo() {
    if (!this.poolManagerContract) {
      throw new Error('PoolManagerContract未初始化');
    }
    return await this.poolManagerContract.getPoolInfo();
  }

  // 获取资金池统计
  async getPoolStats() {
    if (!this.poolManagerContract) {
      throw new Error('PoolManagerContract未初始化');
    }
    return await this.poolManagerContract.getPoolStats();
  }

  // 添加资金到池
  async addFunds(amount: number, description: string = "用户注入资金") {
    if (!this.poolManagerContract) {
      throw new Error('PoolManagerContract未初始化');
    }

    const tx = await this.poolManagerContract.addFunds(description, {
      value: ethers.parseEther(amount.toString())
    });
    return await tx.wait();
  }

  // 转移资金
  async transferFunds(
    to: string,
    amount: number,
    description: string
  ) {
    if (!this.poolManagerContract) {
      throw new Error('PoolManagerContract未初始化');
    }

    const tx = await this.poolManagerContract.transferFunds(
      to,
      ethers.parseEther(amount.toString()),
      description
    );
    return await tx.wait();
  }

  // 获取最近交易
  async getRecentTransactions(count: number) {
    if (!this.poolManagerContract) {
      throw new Error('PoolManagerContract未初始化');
    }
    return await this.poolManagerContract.getRecentTransactions(count);
  }

  // 获取顶级贡献者
  async getTopContributors(count: number) {
    if (!this.poolManagerContract) {
      throw new Error('PoolManagerContract未初始化');
    }
    return await this.poolManagerContract.getTopContributors(count);
  }

  // 获取贡献者信息
  async getContributorInfo(contributorAddress: string) {
    if (!this.poolManagerContract) {
      throw new Error('PoolManagerContract未初始化');
    }
    return await this.poolManagerContract.getContributorInfo(contributorAddress);
  }

  // 重置月度统计
  async resetMonthlyStats() {
    if (!this.poolManagerContract) {
      throw new Error('PoolManagerContract未初始化');
    }

    const tx = await this.poolManagerContract.resetMonthlyStats();
    return await tx.wait();
  }

  // 紧急提款
  async emergencyWithdraw(amount: number) {
    if (!this.poolManagerContract) {
      throw new Error('PoolManagerContract未初始化');
    }

    const tx = await this.poolManagerContract.emergencyWithdraw(
      ethers.parseEther(amount.toString())
    );
    return await tx.wait();
  }
}

// 创建全局Web3服务实例
export const web3Service = new Web3Service();

// 工具函数：格式化以太币（从wei转换为ether）
export const formatEther = (wei: string | number | bigint) => {
  try {
    // 如果已经是格式化后的字符串（包含小数点），直接返回
    if (typeof wei === 'string' && wei.includes('.')) {
      return wei;
    }
    // 如果是0或空值，返回0
    if (!wei || wei === '0' || wei === 0 || wei === BigInt(0)) {
      return '0';
    }
    return ethers.formatEther(wei.toString());
  } catch (error) {
    console.error('formatEther error:', error);
    return '0';
  }
};

// 工具函数：安全格式化金额显示
export const formatAmount = (amount: string | number | bigint) => {
  try {
    if (!amount || amount === '0' || amount === 0 || amount === BigInt(0)) {
      return '0 ETH';
    }
    
    // 如果已经是格式化后的字符串（包含小数点），直接返回
    if (typeof amount === 'string' && amount.includes('.')) {
      return `${amount} ETH`;
    }
    
    // 否则格式化为ether
    return `${ethers.formatEther(amount.toString())} ETH`;
  } catch (error) {
    console.error('formatAmount error:', error);
    return '0 ETH';
  }
};

// 工具函数：转换为Wei（从ether转换为wei）
export const parseEther = (ether: string | number) => {
  try {
    return ethers.parseEther(ether.toString());
  } catch (error) {
    console.error('parseEther error:', error);
    return BigInt(0);
  }
};

// 工具函数：格式化地址
export const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 枚举值映射
export const ENUM_MAPPINGS: Record<string, Record<number, string>> = {
  AreaLevel: {
    0: '城市',
    1: '区县',
    2: '乡村'
  },
  HealthStatus: {
    0: '健康',
    1: '病态',
    2: '危急'
  },
  ApplicationStatus: {
    0: '待审核',
    1: '已通过',
    2: '已拒绝'
  }
};

// 获取枚举显示文本
export const getEnumText = (enumType: string, value: number): string => {
  return ENUM_MAPPINGS[enumType]?.[value] || '未知';
}; 
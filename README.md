# 基金会链上拨款平台

一个基于区块链技术的透明、公平的拨款分配系统。

## 🚀 功能特性

### 前端功能
- **现代化UI设计**：使用Next.js 13和Tailwind CSS构建的响应式界面
- **用户账户切换**：支持管理员和普通用户角色切换
- **动画效果**：丰富的CSS动画和交互效果
- **Web3集成**：完整的MetaMask钱包连接和智能合约交互

### 智能合约功能
- **用户管理**：添加、更新、删除用户信息
- **拨款申请**：用户提交申请，管理员审核
- **资金管理**：资金池管理和资金分配
- **权限控制**：基于角色的访问控制

## 📋 系统架构

### 智能合约
1. **ProxyContract.sol** - 核心业务逻辑合约
   - 用户管理
   - 拨款申请处理
   - 权限控制

2. **Escrow.sol** - 资金托管合约
   - 平台资金池管理
   - 资金安全存储

3. **PoolManager.sol** - 资金池管理合约
   - 资金流入流出管理
   - 交易记录
   - 贡献者管理

### 前端应用
- **Next.js 13** - React框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Ethers.js** - Web3交互
- **MetaMask** - 钱包连接

## 🛠️ 安装和运行

### 前置要求
- Node.js 18+
- MetaMask浏览器扩展
- 本地以太坊网络（Hardhat）

### 1. 安装依赖
```bash
npm install
```

### 2. 启动本地网络
```bash
npx hardhat node
```

### 3. 部署合约
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 4. 启动前端应用
```bash
npm run dev
```

## 🔗 合约地址配置

系统已部署在Injective测试网上，配置以下合约地址：

```json
{
  "PoolManager": "0xb5AE1693d73de6cA78c6E5e767BDfE510B703Dd5",
  "ProxyContract": "0xf3007729f70233d29f8c5Cb38975a6c329945211",
  "Escrow": "0x719Be548a3499A9eB719C84F8720123f819bA43F"
}
```

### 网络信息
- **网络**: Injective Testnet
- **Chain ID**: 1439
- **RPC URL**: https://k8s.testnet.json-rpc.injective.network/
- **区块浏览器**: https://testnet.explorer.injective.network/

详细设置指南请参考 [INJECTIVE_SETUP.md](./INJECTIVE_SETUP.md)

## 💻 使用指南

### 1. 连接钱包
1. 打开应用，点击右上角的"连接钱包"按钮
2. 在MetaMask中确认连接
3. 确保连接到Injective测试网（Chain ID: 1439）
4. 确保账户有足够的INJ代币支付Gas费用

### 2. 管理员功能
- **用户管理**：添加、编辑、删除用户
- **申请审核**：审核用户的拨款申请
- **资金管理**：管理平台资金池
- **合约交互**：直接与智能合约交互

### 3. 用户功能
- **提交申请**：申请拨款
- **查看状态**：查看申请进度
- **个人设置**：管理个人信息

## 🔧 开发指南

### 合约开发
```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 部署到本地网络
npx hardhat run scripts/deploy.js --network localhost
```

### 前端开发
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 📁 项目结构

```
demo2/
├── app/                    # Next.js应用
│   ├── components/         # React组件
│   ├── contexts/          # React上下文
│   ├── services/          # Web3服务
│   └── globals.css        # 全局样式
├── contracts/             # 智能合约
│   ├── abis/             # 合约ABI
│   ├── ProxyContract.sol  # 核心合约
│   ├── Escrow.sol        # 托管合约
│   └── PoolManager.sol   # 资金池合约
├── scripts/              # 部署脚本
└── hardhat.config.js     # Hardhat配置
```

## 🔐 安全特性

- **权限控制**：基于角色的访问控制
- **资金安全**：资金托管在智能合约中
- **透明性**：所有交易记录在区块链上
- **不可篡改**：数据存储在区块链上

## 🚨 注意事项

1. **网络配置**：确保MetaMask连接到正确的网络
2. **Gas费用**：所有交易都需要支付Gas费用
3. **私钥安全**：不要在生产环境中暴露私钥
4. **测试网络**：建议先在测试网络上测试

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 📄 许可证

MIT License

## 📞 支持

如有问题，请提交Issue或联系开发团队。

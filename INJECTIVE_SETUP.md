# Injective测试网设置指南

## 🔗 网络信息

- **网络名称**: Injective Testnet
- **Chain ID**: 1439
- **RPC URL**: https://k8s.testnet.json-rpc.injective.network/
- **区块浏览器**: https://testnet.explorer.injective.network/
- **原生代币**: INJ

## 🛠️ 设置步骤

### 1. MetaMask网络配置

#### 手动添加网络
1. 打开MetaMask
2. 点击网络选择器
3. 选择"添加网络"
4. 填写以下信息：
   - 网络名称: `Injective Testnet`
   - 新的RPC URL: `https://k8s.testnet.json-rpc.injective.network/`
   - Chain ID: `1439`
   - 货币符号: `INJ`
   - 区块浏览器URL: `https://testnet.explorer.injective.network/`

#### 自动添加网络
前端应用会自动检测并提示添加Injective测试网。

### 2. 获取测试网INJ代币

1. 访问Injective测试网水龙头
2. 输入你的钱包地址
3. 获取测试网INJ代币用于支付Gas费用

### 3. 合约地址

已部署的合约地址：
```json
{
  "PoolManager": "0xb5AE1693d73de6cA78c6E5e767BDfE510B703Dd5",
  "ProxyContract": "0xf3007729f70233d29f8c5Cb38975a6c329945211",
  "Escrow": "0x719Be548a3499A9eB719C84F8720123f819bA43F"
}
```

## 🔧 权限检查

### 检查当前权限
```bash
npx hardhat run scripts/check-injective-permissions.js --network injectiveTestnet
```

### 设置管理员权限
如果需要设置新的管理员：
```bash
npx hardhat run scripts/set-manager-injective.js --network injectiveTestnet
```

## 💻 前端使用

### 1. 启动前端应用
```bash
npm run dev
```

### 2. 连接钱包
1. 打开应用
2. 点击"连接钱包"按钮
3. 确保MetaMask连接到Injective测试网
4. 确认连接

### 3. 使用功能
- 切换到"合约交互"标签页
- 查看权限信息
- 执行合约操作

## 🚨 常见问题

### 1. 网络连接失败
- 确保RPC URL正确
- 检查网络连接
- 尝试刷新页面

### 2. 权限不足
- 确保使用正确的账户
- 检查是否为合约所有者或管理员
- 使用权限检查脚本验证

### 3. Gas费用不足
- 确保账户有足够的INJ代币
- 从测试网水龙头获取INJ

### 4. 交易失败
- 检查网络状态
- 确保合约地址正确
- 验证交易参数

## 📊 监控和调试

### 区块浏览器
使用Injective测试网区块浏览器查看：
- 交易状态
- 合约交互
- 账户余额

### 日志查看
在浏览器控制台查看详细错误信息：
```javascript
// 查看Web3连接状态
console.log(window.ethereum);

// 查看网络信息
ethereum.request({ method: 'eth_chainId' });
```

## 🔐 安全注意事项

1. **测试网代币**: 测试网代币没有实际价值
2. **私钥安全**: 不要在代码中硬编码私钥
3. **合约验证**: 在生产环境使用前验证合约
4. **权限管理**: 谨慎管理管理员权限

## 📞 支持

如遇问题，请：
1. 检查网络连接
2. 验证合约地址
3. 查看错误日志
4. 联系开发团队 
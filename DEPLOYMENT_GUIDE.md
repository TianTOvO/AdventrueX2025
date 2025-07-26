# 🚀 部署指南

## 问题诊断

根据错误信息 `missing revert data (action="estimateGas")` 和测试结果，主要问题是：

1. **PoolManager合约的代理合约地址未设置** (`isProxySet: false`)
2. **合约之间的关联关系未建立**

## 🔧 解决方案

### 步骤1：设置PoolManager的代理合约地址

PoolManager合约需要知道ProxyContract的地址才能正常工作。运行以下脚本：

```bash
# 确保使用PoolManager的所有者账户
npx hardhat run scripts/setup-pool-manager.js --network injectiveTestnet
```

### 步骤2：验证设置

运行测试脚本验证设置：

```bash
node test-contract-connection.js
```

应该看到：
```
代理合约设置状态: true
```

### 步骤3：测试addFunds功能

在浏览器控制台中运行：

```javascript
// 复制test-add-funds.js的内容到浏览器控制台
```

## 📋 完整的部署流程

### 1. 环境准备

```bash
# 安装依赖
npm install

# 设置环境变量
echo "PRIVATE_KEY=你的私钥" > .env
```

### 2. 部署合约

```bash
# 部署到Injective测试网
npx hardhat run scripts/deploy.js --network injectiveTestnet
```

### 3. 配置合约关联

```bash
# 设置PoolManager的代理合约地址
npx hardhat run scripts/setup-pool-manager.js --network injectiveTestnet
```

### 4. 验证部署

```bash
# 测试合约连接
node test-contract-connection.js
```

### 5. 启动前端

```bash
npm run dev
```

## 🔍 故障排除

### 错误1：`missing revert data`

**原因**: PoolManager的代理合约地址未设置
**解决**: 运行 `setup-pool-manager.js` 脚本

### 错误2：`Only owner can call this function`

**原因**: 使用了错误的账户
**解决**: 使用PoolManager的所有者账户

### 错误3：`execution reverted`

**原因**: 合约权限问题
**解决**: 检查账户权限和合约状态

## 📊 合约状态检查

运行以下命令检查合约状态：

```bash
# 检查PoolManager状态
npx hardhat run scripts/check-injective-permissions.js --network injectiveTestnet
```

## 🎯 预期结果

设置完成后，你应该能够：

1. ✅ 在资金池管理页面添加资金
2. ✅ 查看资金池统计信息
3. ✅ 管理用户和申请
4. ✅ 执行所有合约功能

## 📞 支持

如果遇到问题，请检查：

1. 网络连接是否正常
2. 账户是否有足够的INJ代币支付Gas费
3. 合约地址是否正确
4. 账户权限是否足够 
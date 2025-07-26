const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 设置合约权限...");

  // 获取部署的合约地址
  const proxyContractAddress = "0xf3007729f70233d29f8c5Cb38975a6c329945211";
  const escrowAddress = "0x719Be548a3499A9eB719C84F8720123f819bA43F";
  const poolManagerAddress = "0xb5AE1693d73de6cA78c6E5e767BDfE510B703Dd5";

  // 获取合约实例
  const ProxyContract = await ethers.getContractFactory("ProxyContract");
  const proxyContract = ProxyContract.attach(proxyContractAddress);

  // 获取当前账户
  const [deployer] = await ethers.getSigners();
  console.log("当前账户:", deployer.address);

  try {
    // 检查当前权限
    const owner = await proxyContract.owner();
    const firstManager = await proxyContract.firstManager();
    
    console.log("\n📋 当前合约权限信息:");
    console.log("合约所有者:", owner);
    console.log("管理员:", firstManager);
    console.log("当前账户:", deployer.address);

    // 检查当前账户是否有权限
    const isOwner = owner.toLowerCase() === deployer.address.toLowerCase();
    const isManager = firstManager.toLowerCase() === deployer.address.toLowerCase();

    console.log("\n🔐 权限检查结果:");
    console.log("是否为所有者:", isOwner ? "✅ 是" : "❌ 否");
    console.log("是否为管理员:", isManager ? "✅ 是" : "❌ 否");

    if (!isOwner && !isManager) {
      console.log("\n⚠️  警告: 当前账户没有管理员权限!");
      console.log("解决方案:");
      console.log("1. 使用合约所有者账户连接钱包");
      console.log("2. 或者使用管理员账户连接钱包");
      console.log("3. 或者调用 setNextManager 函数设置新的管理员");
      
      console.log("\n💡 建议操作:");
      console.log("- 在MetaMask中切换到正确的账户");
      console.log("- 或者使用以下命令设置新的管理员:");
      console.log(`npx hardhat run scripts/set-manager.js --network localhost`);
    } else {
      console.log("\n✅ 当前账户有足够的权限进行操作!");
    }

    // 尝试获取一些基本信息
    console.log("\n📊 尝试获取合约基本信息...");
    
    try {
      const userCount = await proxyContract.userCount();
      console.log("用户总数:", userCount.toString());
    } catch (error) {
      console.log("❌ 无法获取用户总数:", error.message);
    }

    try {
      const applicationCount = await proxyContract.applicationCount();
      console.log("申请总数:", applicationCount.toString());
    } catch (error) {
      console.log("❌ 无法获取申请总数:", error.message);
    }

    // 检查Escrow合约
    console.log("\n🏦 检查Escrow合约...");
    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = Escrow.attach(escrowAddress);
    
    try {
      const platformPool = await escrow.getPlatformPool();
      console.log("平台资金池余额:", ethers.formatEther(platformPool), "ETH");
    } catch (error) {
      console.log("❌ 无法获取平台资金池余额:", error.message);
    }

    // 检查PoolManager合约
    console.log("\n💼 检查PoolManager合约...");
    const PoolManager = await ethers.getContractFactory("PoolManager");
    const poolManager = PoolManager.attach(poolManagerAddress);
    
    try {
      const poolInfo = await poolManager.getPoolInfo();
      console.log("资金池总余额:", ethers.formatEther(poolInfo.totalBalance), "ETH");
      console.log("月度流入:", ethers.formatEther(poolInfo.monthlyInflow), "ETH");
      console.log("月度流出:", ethers.formatEther(poolInfo.monthlyOutflow), "ETH");
    } catch (error) {
      console.log("❌ 无法获取资金池信息:", error.message);
    }

  } catch (error) {
    console.error("❌ 设置权限时出错:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
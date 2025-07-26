const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 设置PoolManager代理合约地址...");

  // 合约地址
  const poolManagerAddress = "0xb5AE1693d73de6cA78c6E5e767BDfE510B703Dd5";
  const proxyContractAddress = "0xf3007729f70233d29f8c5Cb38975a6c329945211";

  try {
    // 获取PoolManager合约实例
    const PoolManager = await ethers.getContractFactory("PoolManager");
    const poolManager = PoolManager.attach(poolManagerAddress);

    // 获取当前账户
    const [deployer] = await ethers.getSigners();
    console.log("当前账户:", deployer.address);

    // 检查当前账户是否为PoolManager的所有者
    const owner = await poolManager.owner();
    console.log("PoolManager所有者:", owner);

    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ 当前账户不是PoolManager的所有者");
      console.log("💡 请使用所有者账户来设置代理合约地址");
      return;
    }

    // 检查代理合约是否已经设置
    const isProxySet = await poolManager.isProxySet();
    console.log("代理合约设置状态:", isProxySet);

    if (isProxySet) {
      console.log("✅ 代理合约已经设置");
      return;
    }

    // 设置代理合约地址
    console.log("设置代理合约地址...");
    const tx = await poolManager.setProxyContract(proxyContractAddress);
    await tx.wait();

    console.log("✅ 代理合约地址设置成功！");
    console.log("交易哈希:", tx.hash);

    // 验证设置
    const newIsProxySet = await poolManager.isProxySet();
    const newProxyContract = await poolManager.proxyContract();
    
    console.log("验证结果:");
    console.log("- 代理合约设置状态:", newIsProxySet);
    console.log("- 代理合约地址:", newProxyContract);

  } catch (error) {
    console.error("❌ 设置失败:", error);
    console.log("\n💡 可能的原因:");
    console.log("1. 当前账户不是PoolManager的所有者");
    console.log("2. 网络连接问题");
    console.log("3. 合约地址不正确");
    console.log("4. Gas费用不足");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
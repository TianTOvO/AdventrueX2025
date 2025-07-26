const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 设置新的管理员...");

  // 获取部署的合约地址
  const proxyContractAddress = "0xf3007729f70233d29f8c5Cb38975a6c329945211";

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
    console.log("当前管理员:", firstManager);

    // 检查当前账户是否为所有者
    const isOwner = owner.toLowerCase() === deployer.address.toLowerCase();
    
    if (!isOwner) {
      console.log("\n❌ 错误: 当前账户不是合约所有者，无法设置管理员!");
      console.log("请使用合约所有者账户运行此脚本。");
      return;
    }

    // 设置新的管理员（使用当前账户作为管理员）
    console.log("\n🔄 设置新的管理员...");
    
    const tx = await proxyContract.setNextManager(deployer.address);
    await tx.wait();
    
    console.log("✅ 管理员设置成功!");
    console.log("新管理员地址:", deployer.address);
    
    // 验证设置
    const newFirstManager = await proxyContract.firstManager();
    console.log("验证 - 当前管理员:", newFirstManager);
    
    if (newFirstManager.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("✅ 管理员设置验证成功!");
    } else {
      console.log("❌ 管理员设置验证失败!");
    }

  } catch (error) {
    console.error("❌ 设置管理员时出错:", error);
    
    if (error.message.includes("Only the first manager or owner")) {
      console.log("\n💡 解决方案:");
      console.log("当前账户没有权限设置管理员。");
      console.log("请确保使用合约所有者账户运行此脚本。");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
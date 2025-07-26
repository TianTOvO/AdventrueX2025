const hre = require("hardhat");

async function main() {
  console.log("开始测试简化版 Escrow 合约部署...");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", (await deployer.getBalance()).toString());

  try {
    // 编译合约
    console.log("\n1. 编译合约...");
    await hre.run("compile");
    console.log("✅ 编译完成");

    // 部署 EscrowSimple 合约
    console.log("\n2. 部署 EscrowSimple 合约...");
    const EscrowSimple = await hre.ethers.getContractFactory("EscrowSimple");
    
    console.log("创建合约工厂...");
    console.log("部署合约...");
    
    const escrow = await EscrowSimple.deploy(deployer.address, {
      gasLimit: 3000000
    });
    
    console.log("等待部署确认...");
    await escrow.deployed();
    
    console.log("✅ EscrowSimple 合约部署成功!");
    console.log("合约地址:", escrow.address);

    // 验证部署
    console.log("\n3. 验证部署...");
    const owner = await escrow.owner();
    const firstManager = await escrow.firstManager();
    const platformPool = await escrow.platformPool();
    const isSet = await escrow.isSet();

    console.log("合约所有者:", owner);
    console.log("第一管理员:", firstManager);
    console.log("平台资金池:", platformPool.toString());
    console.log("代理合约是否设置:", isSet);

    // 测试基本功能
    console.log("\n4. 测试基本功能...");
    
    // 添加资金
    const addFundsTx = await escrow.addPlatformPool({
      value: ethers.utils.parseEther("1")
    });
    await addFundsTx.wait();
    console.log("✅ 添加资金成功");

    const newPoolBalance = await escrow.getPlatformPool();
    console.log("新的资金池余额:", ethers.utils.formatEther(newPoolBalance));

    console.log("\n✅ EscrowSimple 合约测试完成!");

  } catch (error) {
    console.error("❌ 部署失败:", error.message);
    
    // 如果是gas相关错误
    if (error.message.includes("gas") || error.message.includes("out of gas")) {
      console.error("💡 建议: 尝试增加gas限制");
    }
    
    // 如果是编译错误
    if (error.message.includes("compilation")) {
      console.error("💡 建议: 检查合约代码语法");
    }
    
    // 如果是EVM版本错误
    if (error.message.includes("EVM") || error.message.includes("opcode")) {
      console.error("💡 建议: 检查EVM版本兼容性");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("详细错误信息:", error);
    process.exit(1);
  }); 
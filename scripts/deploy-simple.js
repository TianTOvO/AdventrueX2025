const hre = require("hardhat");

async function main() {
  console.log("开始简化部署测试...");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", (await deployer.getBalance()).toString());

  try {
    // 1. 先测试 Escrow 合约部署
    console.log("\n1. 测试 Escrow 合约部署...");
    const Escrow = await hre.ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(deployer.address, {
      gasLimit: 5000000
    });
    await escrow.deployed();
    console.log("✅ Escrow 合约部署成功:", escrow.address);

    // 2. 测试 ProxyContract 合约部署
    console.log("\n2. 测试 ProxyContract 合约部署...");
    const ProxyContract = await hre.ethers.getContractFactory("ProxyContract");
    const proxyContract = await ProxyContract.deploy(deployer.address, escrow.address, {
      gasLimit: 8000000
    });
    await proxyContract.deployed();
    console.log("✅ ProxyContract 合约部署成功:", proxyContract.address);

    // 3. 测试 PoolManager 合约部署
    console.log("\n3. 测试 PoolManager 合约部署...");
    const PoolManager = await hre.ethers.getContractFactory("PoolManager");
    const poolManager = await PoolManager.deploy({
      gasLimit: 5000000
    });
    await poolManager.deployed();
    console.log("✅ PoolManager 合约部署成功:", poolManager.address);

    // 4. 配置合约关联
    console.log("\n4. 配置合约关联...");
    
    // 设置 ProxyContract 地址到 Escrow 合约
    const setProxyTx = await escrow.setProxyContract(proxyContract.address);
    await setProxyTx.wait();
    console.log("✅ Escrow 合约关联配置完成");

    // 设置 ProxyContract 地址到 PoolManager 合约
    const setPoolProxyTx = await poolManager.setProxyContract(proxyContract.address);
    await setPoolProxyTx.wait();
    console.log("✅ PoolManager 合约关联配置完成");

    // 5. 验证部署
    console.log("\n5. 验证部署结果...");
    const escrowFirstManager = await escrow.firstManager();
    const proxyFirstManager = await proxyContract.firstManager();
    const proxyEscrow = await proxyContract.escrow();
    const poolManagerProxy = await poolManager.proxyContract();

    console.log("Escrow 合约管理员:", escrowFirstManager);
    console.log("ProxyContract 管理员:", proxyFirstManager);
    console.log("ProxyContract 关联的 Escrow:", proxyEscrow);
    console.log("PoolManager 关联的 ProxyContract:", poolManagerProxy);

    console.log("\n✅ 所有合约部署成功!");
    console.log("\n📋 部署信息:");
    console.log("PoolManager 合约:", poolManager.address);
    console.log("Escrow 合约:", escrow.address);
    console.log("ProxyContract 合约:", proxyContract.address);
    console.log("管理员地址:", deployer.address);

  } catch (error) {
    console.error("❌ 部署失败:", error.message);
    console.error("错误详情:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 